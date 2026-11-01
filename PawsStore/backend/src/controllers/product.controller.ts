import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  CreateProductBody,
  ListProductsQuery,
  ProductIdParams,
  UpdateProductBody,
} from '../schemas/product.schema.js';
import {
  buildProductsCacheKey,
  invalidateProductsCache,
  readProductsCache,
  writeProductsCache,
} from '../services/cache.service.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../services/product.service.js';

export async function listProductsHandler(
  request: FastifyRequest<{ Querystring: ListProductsQuery }>,
  reply: FastifyReply,
) {
  const {
    page = 1,
    limit = 12,
    min_price,
    max_price,
    min_rating,
    category,
    sort_by,
    order,
  } = request.query;

  const filters = {
    page,
    limit,
    search: request.query.search?.trim() || undefined,
    minPrice: min_price,
    maxPrice: max_price,
    minRating: min_rating,
    category,
    sortBy: sort_by,
    order,
  };

  const cacheKey = buildProductsCacheKey(filters);
  const cached = await readProductsCache<Awaited<ReturnType<typeof listProducts>>>(
    cacheKey,
  );

  if (cached) {
    reply.header('x-cache', 'HIT');
    return reply.send(cached);
  }

  const result = await listProducts(filters);
  await writeProductsCache(cacheKey, result);

  reply.header('x-cache', 'MISS');
  return reply.send(result);
}

export async function getProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply,
) {
  const product = await getProductById(request.params.id);

  if (!product) {
    return reply.code(404).send({ message: 'Product not found' });
  }

  return reply.send(product);
}

export async function createProductHandler(
  request: FastifyRequest<{ Body: CreateProductBody }>,
  reply: FastifyReply,
) {
  const product = await createProduct(request.body);
  await invalidateProductsCache();

  return reply.code(201).send(product);
}

export async function updateProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams; Body: UpdateProductBody }>,
  reply: FastifyReply,
) {
  const product = await updateProduct(request.params.id, request.body);

  if (!product) {
    return reply.code(404).send({ message: 'Product not found' });
  }

  await invalidateProductsCache();

  return reply.send(product);
}

export async function deleteProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply,
) {
  const deleted = await deleteProduct(request.params.id);

  if (!deleted) {
    return reply.code(404).send({ message: 'Product not found' });
  }

  await invalidateProductsCache();

  return reply.code(204).send();
}
