import crypto from 'node:crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

export async function verifyRingHmac(request: FastifyRequest, reply: FastifyReply) {
  // Allow bypassing in simulator routes or during local test execution
  const isSimulation = request.headers['x-clearsight-simulation'] === 'true';
  if (isSimulation && config.NODE_ENV !== 'production') {
    return;
  }

  const signatureHeader = request.headers['x-ring-signature'] || request.headers['x-signature-sha256'];
  const timestampHeader = request.headers['x-ring-timestamp'] as string;

  if (!signatureHeader || !timestampHeader) {
    reply.status(401).send({ error: 'Missing HMAC signature or timestamp headers' });
    return;
  }

  const timeDiff = Math.abs(Date.now() - parseInt(timestampHeader, 10));
  // Reject signatures older than 5 minutes to prevent replay attacks
  if (Number.isNaN(timeDiff) || timeDiff > 300000) {
    reply.status(401).send({ error: 'Webhook timestamp outside permissible replay window' });
    return;
  }

  const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
  const signaturePayload = `${timestampHeader}.${rawBody}`;
  const computedSignature = crypto
    .createHmac('sha256', config.RING_WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest('hex');

  const providedSignature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  const valid = crypto.timingSafeEqual(
    Buffer.from(computedSignature, 'utf-8'),
    Buffer.from(providedSignature, 'utf-8')
  );

  if (!valid) {
    reply.status(403).send({ error: 'Invalid HMAC-SHA256 signature' });
    return;
  }
}
