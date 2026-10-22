import { FastifyInstance } from 'fastify';
import { PlaygroundMediaService } from '../services/playground-media.js';
import { PerceptionService } from '../services/perception-service.js';
import { EventBroadcaster } from '../services/event-broadcaster.js';
import { DoorbellEventPayload } from '../types/index.js';

export async function simulatorRoutes(fastify: FastifyInstance) {
  fastify.post('/api/simulator/trigger', async (request, reply) => {
    const webhookReceivedAt = Date.now();
    const { scenario } = (request.body as { scenario?: 'package' | 'neighbor' | 'loitering' }) || { scenario: 'package' };
    const targetScenario = scenario || 'package';

    const videoUrl = PlaygroundMediaService.getPlaygroundVideoUrl(targetScenario);
    const keyframeBase64 = PlaygroundMediaService.getPlaygroundKeyframe(targetScenario);

    // Multimodal inference on the real video stream via Gemini File API
    const whepNegotiatedAt = Date.now();
    const descriptor = await PerceptionService.analyzeVideo(videoUrl, targetScenario);
    const perceptionCompletedAt = Date.now();

    const payload: DoorbellEventPayload = {
      eventId: `sim_playground_${targetScenario}_${Date.now()}`,
      deviceId: 'ring_playground_doorbell',
      eventType: targetScenario === 'loitering' ? 'motion_detected' : 'button_press',
      timestamp: new Date().toISOString(),
      descriptor,
      videoUrl,
      keyframeBase64,
      telemetry: {
        webhook_received_at: webhookReceivedAt,
        whep_negotiated_at: whepNegotiatedAt,
        perception_completed_at: perceptionCompletedAt,
        total_backend_latency_ms: perceptionCompletedAt - webhookReceivedAt
      }
    };

    EventBroadcaster.broadcastEvent(payload);

    return reply.status(200).send({
      message: `Scenario ${targetScenario} executed with real Gemini video analysis`,
      payload
    });
  });
}