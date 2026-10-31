export const addCartItemBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['productId', 'quantity'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    quantity: { type: 'integer', minimum: 1 },
  },
};

export const updateCartItemBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['quantity'],
  properties: {
    quantity: { type: 'integer', minimum: 1 },
  },
};

export const applyPromoBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['code'],
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50 },
  },
};

export const cartItemParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

export interface AddCartItemBody {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export interface ApplyPromoBody {
  code: string;
}

export interface CartItemParams {
  id: string;
}
