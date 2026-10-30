import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'price' | 'title';
  order?: 'asc' | 'desc';
}

export async function listProducts(filters: ProductFilters) {
  const { page, limit, search, minPrice, maxPrice, minRating, sortBy, order } = filters;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (minRating !== undefined) {
    where.rating = { gte: minRating };
  }

  // No sort_by means newest first; explicit sort defaults to ascending.
  const sortField = sortBy ?? 'createdAt';
  const sortOrder = order ?? (sortBy ? 'asc' : 'desc');

  const primaryOrder: Prisma.ProductOrderByWithRelationInput =
    sortField === 'price'
      ? { price: sortOrder }
      : sortField === 'title'
        ? { title: sortOrder }
        : { createdAt: sortOrder };

  const [totalItems, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [primaryOrder, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: products.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
    meta: {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
      current_page: page,
      limit,
    },
  };
}
