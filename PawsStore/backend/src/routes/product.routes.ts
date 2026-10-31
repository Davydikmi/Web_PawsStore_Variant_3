import type { FastifyInstance } from 'fastify';
import {
  createProductHandler,
  deleteProductHandler,
  listProductsHandler,
  updateProductHandler,
} from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductBodySchema,
  type CreateProductBody,
  type ListProductsQuery,
  type ProductIdParams,
  type UpdateProductBody,
} from '../schemas/product.schema.js';

const adminOnly = { preHandler: [authenticate, requireRole('admin')] };

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: ListProductsQuery }>(
    '/',
    { schema: { querystring: listProductsQuerySchema } },
    listProductsHandler,
  );

  app.post<{ Body: CreateProductBody }>(
    '/',
    { ...adminOnly, schema: { body: createProductBodySchema } },
    createProductHandler,
  );

  app.patch<{ Params: ProductIdParams; Body: UpdateProductBody }>(
    '/:id',
    {
      ...adminOnly,
      schema: { params: productIdParamsSchema, body: updateProductBodySchema },
    },
    updateProductHandler,
  );

  app.delete<{ Params: ProductIdParams }>(
    '/:id',
    { ...adminOnly, schema: { params: productIdParamsSchema } },
    deleteProductHandler,
  );
}
