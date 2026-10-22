import { FastifyInstance } from 'fastify';
import { RingService } from '../services/ring-service.js';
import { EventBroadcaster } from '../services/event-broadcaster.js';

export async function chimeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/chime/play', async (request, reply) => {
    const { deviceId, audioRef } = request.body as { deviceId: string; audioRef: string };

    if (!deviceId || !audioRef) {
      return reply.status(400).send({ error: 'Missing deviceId or audioRef parameter' });
    }

    const success = await RingService.playChimeTone(deviceId, audioRef);
    if (success) {
      EventBroadcaster.broadcastChimeAck(deviceId, audioRef);
      return reply.status(200).send({ status: 'chime_tone_triggered', audioRef });
    }

    return reply.status(500).send({ error: 'Failed to trigger exterior chime playback' });
  });
}
