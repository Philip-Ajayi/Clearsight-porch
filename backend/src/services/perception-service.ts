import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { PerceptionDescriptor } from '../types/index.js';
import { PlaygroundMediaService } from './playground-media.js';

interface CachedGeminiVideo {
  fileUri: string;
  fileName: string;
  mimeType: string;
  uploadedAt: number;
}

export class PerceptionService {
  private static videoCache: Map<string, CachedGeminiVideo> = new Map();
  private static tempDir = path.join(os.tmpdir(), 'clearsight-video-cache');
  private static isWarmingUp = false;

  private static ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private static async downloadVideo(url: string, targetPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video from ${url} (HTTP ${response.status})`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(targetPath, buffer);
  }

  private static async uploadVideoToGemini(
    localFilePath: string,
    displayName: string
  ): Promise<{ fileUri: string; fileName: string; mimeType: string }> {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

    console.log(`[PerceptionService] Uploading real MP4 (${localFilePath}) to Gemini via @google/genai...`);
    const uploadResult = await ai.files.upload({
      file: localFilePath,
      config: {
        mimeType: 'video/mp4',
        displayName,
      },
    });

    const fileName = uploadResult.name || (uploadResult as unknown as { file?: { name?: string } }).file?.name;
    if (!fileName) {
      throw new Error('File upload failed to return a valid file identifier.');
    }

    console.log(`[PerceptionService] Video registered as ${fileName}. Polling processing status...`);

    let file = await ai.files.get({ name: fileName });
    let attempts = 0;
    const maxAttempts = 60;

    while (file.state === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      file = await ai.files.get({ name: fileName });
      attempts++;
    }

    if (file.state === 'FAILED') {
      throw new Error(`Gemini video processing failed on Google servers for ${fileName}`);
    }

    if (file.state !== 'ACTIVE') {
      throw new Error(`Video file not active after ${maxAttempts}s (current status: ${file.state})`);
    }

    const fileUri = file.uri || (file as unknown as { file?: { uri?: string } }).file?.uri;
    if (!fileUri) {
      throw new Error('Uploaded file object is missing uri property.');
    }

    console.log(`[PerceptionService] Real video is ACTIVE in Gemini File API: ${fileUri}`);

    return {
      fileUri,
      fileName,
      mimeType: 'video/mp4',
    };
  }

  private static async getOrUploadVideo(
    videoUrl: string,
    scenarioHint: string
  ): Promise<{ fileUri: string; mimeType: string }> {
    this.ensureTempDirectory();

    const cacheKey = crypto.createHash('sha256').update(videoUrl).digest('hex');
    const cached = this.videoCache.get(cacheKey);

    const FORTY_HOURS_MS = 40 * 60 * 60 * 1000;
    if (cached && Date.now() - cached.uploadedAt < FORTY_HOURS_MS) {
      console.log(`[PerceptionService] Utilizing cached Gemini File URI for [${scenarioHint}]: ${cached.fileUri}`);
      return { fileUri: cached.fileUri, mimeType: cached.mimeType };
    }

    const localFileName = `${scenarioHint}_${cacheKey.slice(0, 8)}.mp4`;
    const localFilePath = path.join(this.tempDir, localFileName);

    if (!fs.existsSync(localFilePath)) {
      console.log(`[PerceptionService] Downloading video stream from: ${videoUrl}`);
      await this.downloadVideo(videoUrl, localFilePath);
    }

    const uploaded = await this.uploadVideoToGemini(localFilePath, `Doorbell_${scenarioHint}`);

    this.videoCache.set(cacheKey, {
      fileUri: uploaded.fileUri,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      uploadedAt: Date.now(),
    });

    return { fileUri: uploaded.fileUri, mimeType: uploaded.mimeType };
  }

  public static async warmupScenarios(): Promise<void> {
    if (!config.GEMINI_API_KEY || this.isWarmingUp) {
      return;
    }

    this.isWarmingUp = true;
    console.log('[PerceptionService] Commencing background video pre-warming into Gemini File API...');

    const scenarios = ['package', 'neighbor', 'loitering'] as const;

    for (const sc of scenarios) {
      try {
        const url = PlaygroundMediaService.getPlaygroundVideoUrl(sc);
        await this.getOrUploadVideo(url, sc);
        console.log(`[PerceptionService] Pre-warmed video scenario: [${sc}]`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[PerceptionService] Failed to pre-warm scenario [${sc}]:`, message);
      }
    }

    this.isWarmingUp = false;
  }

  public static async analyzeVideo(
    videoUrl: string,
    scenarioHint: 'package' | 'neighbor' | 'loitering' = 'package'
  ): Promise<PerceptionDescriptor> {
    if (!config.GEMINI_API_KEY) {
      console.warn('[PerceptionService] No GEMINI_API_KEY detected. Utilizing Playground Ground-Truth.');
      return PlaygroundMediaService.getGroundTruthDescriptor(scenarioHint);
    }

    try {
      const { fileUri, mimeType } = await this.getOrUploadVideo(videoUrl, scenarioHint);
      const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

      const prompt = `You are ClearSight Porch, an edge accessibility vision gateway assisting a blind homeowner.
Analyze this video footage from the front doorbell camera.
Identify the visitor, attire, actions, and estimate their spatial 3D coordinates on the porch.`;

      const perceptionJsonSchema = {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Concise 1-sentence description under 20 words identifying the person, attire, carried items, and spatial doorstep location.',
          },
          visitor: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'delivery_person, neighbor, visitor, service_worker, or unknown' },
              attire: { type: 'string', description: 'string describing clothing' },
              items_carried: { type: 'array', items: { type: 'string' }, description: 'array of strings' },
              posture: { type: 'string', description: 'string describing posture' },
              distance_feet: { type: 'number', description: 'distance in feet' },
            },
            required: ['type', 'attire', 'items_carried', 'posture', 'distance_feet'],
          },
          spatial_coordinates: {
            type: 'object',
            properties: {
              x: { type: 'number', description: '-1.0 (far left) to +1.0 (far right), 0.0 is dead center' },
              y: { type: 'number', description: '-1.0 (ground level) to +1.0 (eye level)' },
              z: { type: 'number', description: 'distance depth in meters (0.5 to 5.0)' },
            },
            required: ['x', 'y', 'z'],
          },
          urgency: { type: 'string', description: 'low, normal, or high' },
          intent: { type: 'string', description: 'package_dropoff, social_visit, service_inspection, suspicious_loitering, or unknown' },
        },
        required: ['summary', 'visitor', 'spatial_coordinates', 'urgency', 'intent'],
      };

      let responseText: string | undefined;

      // Primary Strategy: Interactions API
      try {
        console.log(`[PerceptionService] Dispatching video (${fileUri}) to Gemini Interactions API...`);
        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: [
            { type: 'video', uri: fileUri, mime_type: mimeType },
            { type: 'text', text: prompt },
          ],
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: perceptionJsonSchema,
          },
        });
        responseText = interaction.output_text;
      } catch (interactionError) {
        console.warn('[PerceptionService] Interactions API failed, using models.generateContent fallback:', interactionError);

        // Fallback Strategy: Standard Content Generation
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { fileData: { fileUri, mimeType } },
                { text: `${prompt}\nRespond STRICTLY with valid JSON following the schema.` },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: perceptionJsonSchema,
          },
        });
        responseText = response.text;
      }

      if (!responseText) {
        throw new Error('Received empty response text from Gemini.');
      }

      // Sanitize potential markdown code fences
      const cleanJson = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson) as PerceptionDescriptor;
      console.log(`[PerceptionService] Gemini Video Inference Successful: "${parsed.summary}"`);
      return parsed;
    } catch (error) {
      console.error('[PerceptionService] Gemini video analysis failed, reverting to Ground Truth:', error);
      return PlaygroundMediaService.getGroundTruthDescriptor(scenarioHint);
    }
  }

  public static async analyzeScene(
    keyframeBase64?: string,
    scenarioHint: 'package' | 'neighbor' | 'loitering' = 'package'
  ): Promise<PerceptionDescriptor> {
    const videoUrl = PlaygroundMediaService.getPlaygroundVideoUrl(scenarioHint);
    return this.analyzeVideo(videoUrl, scenarioHint);
  }
}