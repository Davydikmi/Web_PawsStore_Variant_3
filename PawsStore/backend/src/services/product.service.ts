import { Prisma } from '@prisma/client';
import type { Product, ProductCategory } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: ProductCategory;
  sortBy?: 'price' | 'title' | 'rating';
  order?: 'asc' | 'desc';
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
  reviews?: number;
  shortDescription?: string;
  highlights?: string[];
  specifications?: Prisma.InputJsonValue;
  category?: ProductCategory;
  stockQuantity?: number;
}

export type UpdateProductData = Partial<CreateProductData>;

function toProductResponse(product: Product) {
  return {
    ...product,
    price: Number(product.price),
  };
}

export async function listProducts(filters: ProductFilters) {
  const {
    page,
    limit,
    search,
    minPrice,
    maxPrice,
    minRating,
    category,
    sortBy,
    order,
  } = filters;

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

  if (category) {
    where.category = category;
  }

  // No sort_by means newest first; explicit sort defaults to ascending.
  const sortField = sortBy ?? 'createdAt';
  const sortOrder = order ?? (sortBy ? 'asc' : 'desc');

  const primaryOrder: Prisma.ProductOrderByWithRelationInput =
    sortField === 'price'
      ? { price: sortOrder }
      : sortField === 'title'
        ? { title: sortOrder }
        : sortField === 'rating'
          ? { rating: sortOrder }
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

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  return product ? toProductResponse(product) : null;
}

export async function createProduct(data: CreateProductData) {
  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      price: data.price,
      rating: data.rating,
      reviews: data.reviews,
      images: data.images,
      highlights: data.highlights ?? [],
      specifications: data.specifications,
      category: data.category,
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
        shortDescription: data.shortDescription,
        price: data.price,
        rating: data.rating,
        reviews: data.reviews,
        images: data.images,
        highlights: data.highlights,
        specifications: data.specifications,
        category: data.category,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false;
    }

    throw error;
  }
}
