import type { FastifyInstance } from 'fastify';
import {
  addCartItemHandler,
  applyPromoHandler,
  getCartHandler,
  removeCartItemHandler,
  updateCartItemHandler,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  addCartItemBodySchema,
  applyPromoBodySchema,
  cartItemParamsSchema,
  updateCartItemBodySchema,
  type AddCartItemBody,
  type ApplyPromoBody,
  type CartItemParams,
  type UpdateCartItemBody,
} from '../schemas/cart.schema.js';

const cartSchema = {
  tags: ['cart'],
  security: [{ bearerAuth: [] }],
};

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', { schema: { ...cartSchema, summary: 'Get current user cart' } }, getCartHandler);

  app.post<{ Body: AddCartItemBody }>(
    '/items',
    {
      schema: {
        ...cartSchema,
        summary: 'Add a product to the cart',
        body: addCartItemBodySchema,
      },
    },
    addCartItemHandler,
  );

  app.patch<{ Params: CartItemParams; Body: UpdateCartItemBody }>(
    '/items/:id',
    {
      schema: {
        ...cartSchema,
        summary: 'Update cart item quantity',
        params: cartItemParamsSchema,
        body: updateCartItemBodySchema,
      },
    },
    updateCartItemHandler,
  );

  app.delete<{ Params: CartItemParams }>(
    '/items/:id',
    {
      schema: {
        ...cartSchema,
        summary: 'Remove an item from the cart',
        params: cartItemParamsSchema,
      },
    },
    removeCartItemHandler,
  );

  app.post<{ Body: ApplyPromoBody }>(
    '/apply-promo',
    {
      schema: {
        ...cartSchema,
        summary: 'Apply a promo code to the cart',
        body: applyPromoBodySchema,
      },
    },
    applyPromoHandler,
  );
}
