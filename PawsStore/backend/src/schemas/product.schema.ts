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
    sort_by: { type: 'string', enum: ['price', 'title'] },
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
  sort_by?: 'price' | 'title';
  order?: 'asc' | 'desc';
}

const productBodyProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  description: { type: 'string', minLength: 1 },
  price: { type: 'number', minimum: 0 },
  rating: { type: 'number', minimum: 0, maximum: 5 },
  images: { type: 'array', items: { type: 'string' } },
  stockQuantity: { type: 'integer', minimum: 0 },
};

export const createProductBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'price'],
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
  rating?: number;
  images?: string[];
  stockQuantity?: number;
}

export type UpdateProductBody = Partial<CreateProductBody>;

export interface ProductIdParams {
  id: string;
}
