import type { Prisma } from '@prisma/client';

export type ProductCategoryValue = 'food' | 'toy' | 'accessory' | 'beds' | 'furniture';

const productCategories = ['food', 'toy', 'accessory', 'beds', 'furniture'];

export const listProductsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, default: 12 },
    search: { type: 'string', minLength: 1, maxLength: 200 },
    min_price: { type: 'number', minimum: 0 },
    max_price: { type: 'number', minimum: 0 },
    min_rating: { type: 'number', minimum: 0, maximum: 5 },
    category: { type: 'string', enum: productCategories },
    sort_by: { type: 'string', enum: ['price', 'title', 'rating'] },
    order: { type: 'string', enum: ['asc', 'desc'] },
  },
};

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  category?: ProductCategoryValue;
  sort_by?: 'price' | 'title' | 'rating';
  order?: 'asc' | 'desc';
}

const productBodyProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  description: { type: 'string', minLength: 1 },
  shortDescription: { type: 'string', maxLength: 500 },
  price: { type: 'number', minimum: 0 },
  rating: { type: 'number', minimum: 0, maximum: 5 },
  reviews: { type: 'integer', minimum: 0 },
  images: { type: 'array', items: { type: 'string' }, minItems: 3 },
  highlights: { type: 'array', items: { type: 'string' } },
  specifications: { type: 'object' },
  category: { type: 'string', enum: productCategories },
  stockQuantity: { type: 'integer', minimum: 0 },
};

export const createProductBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'price', 'images'],
  properties: productBodyProperties,
};

export const updateProductBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: productBodyProperties,
};

export const productIdParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

export interface CreateProductBody {
  title: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
  reviews?: number;
  shortDescription?: string;
  highlights?: string[];
  specifications?: Prisma.InputJsonValue;
  category?: ProductCategoryValue;
  stockQuantity?: number;
}

export type UpdateProductBody = Partial<CreateProductBody>;

export interface ProductIdParams {
  id: string;
}
