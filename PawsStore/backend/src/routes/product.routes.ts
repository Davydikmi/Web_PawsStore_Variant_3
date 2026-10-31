import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { listProductsHandler } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  listProductsQuerySchema,
  type ListProductsQuery,
} from '../schemas/product.schema.js';

const adminOnly = { preHandler: [authenticate, requireRole('admin')] };

// TODO: replace with the product controller once admin product endpoints are implemented.
async function notImplemented(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.code(501).send({ message: 'Admin product endpoints are not implemented yet' });
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: ListProductsQuery }>(
    '/',
    { schema: { querystring: listProductsQuerySchema } },
    listProductsHandler,
  );

  app.post('/', adminOnly, notImplemented);
  app.patch('/', adminOnly, notImplemented);
  app.delete('/', adminOnly, notImplemented);
}
