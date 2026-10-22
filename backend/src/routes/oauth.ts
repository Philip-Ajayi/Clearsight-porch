import { FastifyInstance } from 'fastify';

export async function oauthRoutes(fastify: FastifyInstance) {
  // 1. Account Link URL
  fastify.get('/oauth/authorize', async (request, reply) => {
    const query = request.query as { redirect_uri?: string; state?: string };

    // Auto-approve and redirect back to Ring with a mock authorization code
    if (query.redirect_uri) {
      const code = `clearsight_code_${Date.now()}`;
      return reply.redirect(`${query.redirect_uri}?code=${code}&state=${query.state || ''}`);
    }

    return reply.status(200).send({ status: 'ClearSight Authorization Ready' });
  });

  // 2. Token Exchange URL
  fastify.post('/oauth/token', async (_request, reply) => {
    return reply.status(200).send({
      access_token: `clearsight_access_token_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: `clearsight_refresh_token_${Date.now()}`,
    });
  });
}