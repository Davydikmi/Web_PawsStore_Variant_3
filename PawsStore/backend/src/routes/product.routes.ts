import type { FastifyInstance } from 'fastify';
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
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

const publicProductSchema = { tags: ['products'] };
const adminProductSchema = {
  tags: ['products'],
  security: [{ bearerAuth: [] }],
};

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: ListProductsQuery }>(
    '/',
    {
      schema: {
        ...publicProductSchema,
        summary: 'List products with filtering, sorting and pagination',
        querystring: listProductsQuerySchema,
      },
    },
    listProductsHandler,
  );

  app.get<{ Params: ProductIdParams }>(
    '/:id',
    {
      schema: {
        ...publicProductSchema,
        summary: 'Get a single product',
        params: productIdParamsSchema,
      },
    },
    getProductHandler,
  );

  app.post<{ Body: CreateProductBody }>(
    '/',
    {
      ...adminOnly,
      schema: {
        ...adminProductSchema,
        summary: 'Create a product (admin)',
        body: createProductBodySchema,
      },
    },
    createProductHandler,
  );

  app.patch<{ Params: ProductIdParams; Body: UpdateProductBody }>(
    '/:id',
    {
      ...adminOnly,
      schema: {
        ...adminProductSchema,
        summary: 'Update a product (admin)',
        params: productIdParamsSchema,
        body: updateProductBodySchema,
      },
    },
    updateProductHandler,
  );

  app.delete<{ Params: ProductIdParams }>(
    '/:id',
    {
      ...adminOnly,
      schema: {
        ...adminProductSchema,
        summary: 'Delete a product (admin)',
        params: productIdParamsSchema,
      },
    },
    deleteProductHandler,
  );
}
