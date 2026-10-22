import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { webhookRoutes } from './routes/webhooks.js';
import { whepRoutes } from './routes/whep.js';
import { chimeRoutes } from './routes/chime.js';
import { simulatorRoutes } from './routes/simulator.js';
import { oauthRoutes } from './routes/oauth.js';
import { EventBroadcaster } from './services/event-broadcaster.js';
import { PerceptionService } from './services/perception-service.js';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

async function buildServer() {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Ring-Signature', 'X-Ring-Timestamp', 'X-Clearsight-Simulation']
  });

  await fastify.register(websocket);

  // Streaming WebSocket Endpoint
  fastify.register(async (app) => {
    app.get('/ws', { websocket: true }, (socket) => {
      EventBroadcaster.registerClient(socket);
      socket.send(JSON.stringify({
        type: 'INIT_ACK',
        message: 'ClearSight Spatial Gateway Online',
        timestamp: new Date().toISOString()
      }));
    });
  });

  // Health & Root Ingress Probes (Prevents 404 on Render ping)
  fastify.route({
    method: ['GET', 'HEAD'],
    url: '/',
    handler: async () => ({ status: 'ok', service: 'clearsight-backend' })
  });

  fastify.route({
    method: ['GET', 'HEAD'],
    url: '/health',
    handler: async () => ({
      status: 'healthy',
      uptime_seconds: process.uptime(),
      active_subscribers: EventBroadcaster.getActiveClientCount()
    })
  });

  // Route Registrations
  await fastify.register(webhookRoutes);
  await fastify.register(whepRoutes);
  await fastify.register(chimeRoutes);
  await fastify.register(simulatorRoutes);
  await fastify.register(oauthRoutes);
}

const start = async () => {
  try {
    await buildServer();
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`[ClearSight Backend] Server listening on http://0.0.0.0:${config.PORT}`);

    // Pre-upload real scenario videos in the background so inference is immediate
    PerceptionService.warmupScenarios().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.warn(`[PerceptionService] Background video warm-up notice: ${msg}`);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();