import { Prisma } from '@prisma/client';
import type { Product } from '@prisma/client';
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

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  rating?: number;
  images?: string[];
  stockQuantity?: number;
}

export type UpdateProductData = Partial<CreateProductData>;

export class ProductInUseError extends Error {
  constructor() {
    super('Product is used in carts and cannot be deleted');
    this.name = 'ProductInUseError';
  }
}

function toProductResponse(product: Product) {
  return {
    ...product,
    price: Number(product.price),
  };
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
    items: products.map(toProductResponse),
    meta: {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
      current_page: page,
      limit,
    },
  };
}

export async function createProduct(data: CreateProductData) {
  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      rating: data.rating,
      images: data.images ?? [],
      stockQuantity: data.stockQuantity,
    },
  });

  return toProductResponse(product);
}

export async function updateProduct(id: string, data: UpdateProductData) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        rating: data.rating,
        images: data.images,
        stockQuantity: data.stockQuantity,
      },
    });

    return toProductResponse(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }

    throw error;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { id } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return false;
      }

      if (error.code === 'P2003') {
        throw new ProductInUseError();
      }
    }

    throw error;
  }
}
