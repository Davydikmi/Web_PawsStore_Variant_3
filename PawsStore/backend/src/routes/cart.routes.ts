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

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', getCartHandler);

  app.post<{ Body: AddCartItemBody }>(
    '/items',
    { schema: { body: addCartItemBodySchema } },
    addCartItemHandler,
  );

  app.patch<{ Params: CartItemParams; Body: UpdateCartItemBody }>(
    '/items/:id',
    { schema: { params: cartItemParamsSchema, body: updateCartItemBodySchema } },
    updateCartItemHandler,
  );

  app.delete<{ Params: CartItemParams }>(
    '/items/:id',
    { schema: { params: cartItemParamsSchema } },
    removeCartItemHandler,
  );

  app.post<{ Body: ApplyPromoBody }>(
    '/apply-promo',
    { schema: { body: applyPromoBodySchema } },
    applyPromoHandler,
  );
}
