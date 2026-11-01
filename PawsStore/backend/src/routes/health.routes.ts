import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getRedis } from '../lib/redis.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    { schema: { tags: ['health'], summary: 'Liveness probe' } },
    async () => ({
      status: 'ok',
      uptime: Math.round(process.uptime()),
    }),
  );

  app.get(
    '/health/ready',
    { schema: { tags: ['health'], summary: 'Readiness probe (DB + Redis)' } },
    async (request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        await getRedis().ping();

        return { status: 'ok', database: 'up', redis: 'up' };
      } catch (error) {
        request.log.error(error);
        return reply
          .code(503)
          .send({ status: 'error', database: 'down', redis: 'down' });
      }
    },
  );
}
