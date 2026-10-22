import { FastifyInstance } from 'fastify';
import { verifyRingHmac } from '../middleware/hmac.js';
import { PerceptionService } from '../services/perception-service.js';
import { EventBroadcaster } from '../services/event-broadcaster.js';
import { DoorbellEventPayload, RingWebhookRawBody } from '../types/index.js';
import { PlaygroundMediaService } from '../services/playground-media.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/api/webhooks/ring', {
    preHandler: verifyRingHmac
  }, async (request, reply) => {
    const webhookReceivedAt = Date.now();
    const body = request.body as RingWebhookRawBody;

    const videoUrl = body.video_sample_url || PlaygroundMediaService.getPlaygroundVideoUrl('package');
    const keyframeBase64 = PlaygroundMediaService.getPlaygroundKeyframe('package');

    const whepNegotiatedAt = Date.now();
    const descriptor = await PerceptionService.analyzeVideo(videoUrl, 'package');
    const perceptionCompletedAt = Date.now();

    const payload: DoorbellEventPayload = {
      eventId: body.event_id || `evt_${Date.now()}`,
      deviceId: body.device_id || 'doorbell_front_porch',
      eventType: body.event_type || 'button_press',
      timestamp: body.timestamp || new Date().toISOString(),
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
      status: 'success',
      event_id: payload.eventId,
      latency_ms: payload.telemetry.total_backend_latency_ms
    });
  });
}