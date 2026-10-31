import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AddCartItemBody,
  ApplyPromoBody,
  CartItemParams,
  UpdateCartItemBody,
} from '../schemas/cart.schema.js';
import {
  addCartItem,
  applyPromoCode,
  CartItemNotFoundError,
  EmptyCartError,
  getCart,
  InsufficientStockError,
  InvalidPromoCodeError,
  ProductNotFoundError,
  PromoCodeAlreadyAppliedError,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service.js';

function sendCartError(error: unknown, reply: FastifyReply): FastifyReply | null {
  if (error instanceof ProductNotFoundError || error instanceof CartItemNotFoundError) {
    return reply.code(404).send({ message: error.message });
  }

  if (
    error instanceof InsufficientStockError ||
    error instanceof EmptyCartError ||
    error instanceof InvalidPromoCodeError
  ) {
    return reply.code(400).send({ message: error.message });
  }

  if (error instanceof PromoCodeAlreadyAppliedError) {
    return reply.code(409).send({ message: error.message });
  }

  return null;
}

export async function getCartHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.send(await getCart(request.user.sub));
}

export async function addCartItemHandler(
  request: FastifyRequest<{ Body: AddCartItemBody }>,
  reply: FastifyReply,
) {
  try {
    const cart = await addCartItem(
      request.user.sub,
      request.body.productId,
      request.body.quantity,
    );

    return reply.send(cart);
  } catch (error) {
    const response = sendCartError(error, reply);

    if (response) {
      return response;
    }

    throw error;
  }
}

export async function updateCartItemHandler(
  request: FastifyRequest<{ Params: CartItemParams; Body: UpdateCartItemBody }>,
  reply: FastifyReply,
) {
  try {
    const cart = await updateCartItem(
      request.user.sub,
      request.params.id,
      request.body.quantity,
    );

    return reply.send(cart);
  } catch (error) {
    const response = sendCartError(error, reply);

    if (response) {
      return response;
    }

    throw error;
  }
}

export async function removeCartItemHandler(
  request: FastifyRequest<{ Params: CartItemParams }>,
  reply: FastifyReply,
) {
  try {
    const cart = await removeCartItem(request.user.sub, request.params.id);

    return reply.send(cart);
  } catch (error) {
    const response = sendCartError(error, reply);

    if (response) {
      return response;
    }

    throw error;
  }
}

export async function applyPromoHandler(
  request: FastifyRequest<{ Body: ApplyPromoBody }>,
  reply: FastifyReply,
) {
  try {
    const cart = await applyPromoCode(request.user.sub, request.body.code);

    return reply.send(cart);
  } catch (error) {
    const response = sendCartError(error, reply);

    if (response) {
      return response;
    }

    throw error;
  }
}
