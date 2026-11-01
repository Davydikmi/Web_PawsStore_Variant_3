import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { id: 'asc' },
  },
  promoCode: true,
} satisfies Prisma.CartInclude;

type CartWithDetails = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  title: string;
  price: number;
  images: string[];
  stockQuantity: number;
  lineTotal: number;
}

export interface CartResponse {
  id: string | null;
  items: CartItemResponse[];
  promoCode: string | null;
  discountPercentage: number;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
    this.name = 'ProductNotFoundError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor() {
    super('Cart item not found');
    this.name = 'CartItemNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(available: number) {
    super(`Insufficient stock: only ${available} item(s) available`);
    this.name = 'InsufficientStockError';
  }
}

export class EmptyCartError extends Error {
  constructor() {
    super('Cart is empty');
    this.name = 'EmptyCartError';
  }
}

export class PromoCodeAlreadyAppliedError extends Error {
  constructor() {
    super('A promo code is already applied to this cart');
    this.name = 'PromoCodeAlreadyAppliedError';
  }
}

export class InvalidPromoCodeError extends Error {
  constructor() {
    super('Promo code is invalid, inactive or expired');
    this.name = 'InvalidPromoCodeError';
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildCartResponse(cart: CartWithDetails | null): CartResponse {
  const items = cart?.items ?? [];

  let subtotal = 0;

  const mappedItems = items.map((item) => {
    const price = Number(item.product.price);
    const lineTotal = round(price * item.quantity);
    subtotal = round(subtotal + lineTotal);

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      title: item.product.title,
      price,
      images: item.product.images,
      stockQuantity: item.product.stockQuantity,
      lineTotal,
    };
  });

  const discountPercentage = cart?.promoCode?.discountPercentage ?? 0;
  const discount = round((subtotal * discountPercentage) / 100);

  return {
    id: cart?.id ?? null,
    items: mappedItems,
    promoCode: cart?.promoCode?.code ?? null,
    discountPercentage,
    subtotal,
    discount,
    total: round(subtotal - discount),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function findCart(userId: string): Promise<CartWithDetails | null> {
  return prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
}

async function refreshCart(userId: string): Promise<CartResponse> {
  const cart = await findCart(userId);

  if (!cart) {
    return buildCartResponse(null);
  }

  const response = buildCartResponse(cart);

  if (cart.discount !== response.discount) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { discount: response.discount },
    });
  }

  return response;
}

export async function getCart(userId: string): Promise<CartResponse> {
  return buildCartResponse(await findCart(userId));
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new ProductNotFoundError();
  }

  const existingCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  const existingItem = existingCart?.items.find((item) => item.productId === productId);
  const newQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (newQuantity > product.stockQuantity) {
    throw new InsufficientStockError(product.stockQuantity);
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return refreshCart(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartResponse> {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true },
  });

  if (!item) {
    throw new CartItemNotFoundError();
  }

  if (quantity > item.product.stockQuantity) {
    throw new InsufficientStockError(item.product.stockQuantity);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return refreshCart(userId);
}

export async function removeCartItem(
  userId: string,
  itemId: string,
): Promise<CartResponse> {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });

  if (!item) {
    throw new CartItemNotFoundError();
  }

  await prisma.cartItem.delete({ where: { id: item.id } });

  return refreshCart(userId);
}

export async function applyPromoCode(
  userId: string,
  code: string,
): Promise<CartResponse> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } }, promoCode: true },
  });

  if (!cart || cart.items.length === 0) {
    throw new EmptyCartError();
  }

  if (cart.promoCodeId) {
    throw new PromoCodeAlreadyAppliedError();
  }

  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  const isExpired = promoCode?.expiresAt ? promoCode.expiresAt <= new Date() : false;

  if (!promoCode || !promoCode.isActive || isExpired) {
    throw new InvalidPromoCodeError();
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const discount = round((subtotal * promoCode.discountPercentage) / 100);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { promoCodeId: promoCode.id, discount },
  });

  return refreshCart(userId);
}
