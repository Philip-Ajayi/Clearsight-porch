import { FastifyInstance } from 'fastify';
import { RingService } from '../services/ring-service.js';

export async function whepRoutes(fastify: FastifyInstance) {
  // Register SDP content-type parser so Fastify accepts WebRTC offers
  fastify.addContentTypeParser('application/sdp', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  fastify.post('/api/whep/session', async (request, reply) => {
    const clientOfferSdp = request.body as string;
    const deviceId = (request.query as { deviceId?: string }).deviceId || 'ring_playground_doorbell';

    try {
      const { answerSdp, sessionLocation } = await RingService.negotiateWhepSession(
        deviceId,
        clientOfferSdp
      );

      reply
        .status(201)
        .header('Content-Type', 'application/sdp')
        .header('Location', sessionLocation)
        .send(answerSdp);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(error);
      reply.status(502).send({ error: 'WHEP SDP proxy negotiation failed', details: message });
    }
  });

  fastify.delete('/api/whep/session/:sessionId', async (_request, reply) => {
    return reply.status(200).send({ status: 'session_terminated' });
  });
}