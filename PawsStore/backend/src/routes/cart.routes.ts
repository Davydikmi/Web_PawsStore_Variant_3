import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';

// TODO: replace with the cart controller once cart endpoints are implemented.
async function notImplemented(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.code(501).send({ message: 'Cart endpoints are not implemented yet' });
}

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', notImplemented);
  app.post('/', notImplemented);
  app.patch('/', notImplemented);
  app.delete('/', notImplemented);
}
