import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const adminOnly = { preHandler: [authenticate, requireRole('admin')] };

// TODO: replace with the product controller once admin product endpoints are implemented.
async function notImplemented(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.code(501).send({ message: 'Product endpoints are not implemented yet' });
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', adminOnly, notImplemented);
  app.patch('/', adminOnly, notImplemented);
  app.delete('/', adminOnly, notImplemented);
}
