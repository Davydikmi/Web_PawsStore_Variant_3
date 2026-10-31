import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListProductsQuery } from '../schemas/product.schema.js';
import { listProducts } from '../services/product.service.js';

export async function listProductsHandler(
  request: FastifyRequest<{ Querystring: ListProductsQuery }>,
  reply: FastifyReply,
) {
  const { page = 1, limit = 12, min_price, max_price, min_rating, sort_by, order } =
    request.query;

  const search = request.query.search?.trim() || undefined;

  const result = await listProducts({
    page,
    limit,
    search,
    minPrice: min_price,
    maxPrice: max_price,
    minRating: min_rating,
    sortBy: sort_by,
    order,
  });

  return reply.send(result);
}
