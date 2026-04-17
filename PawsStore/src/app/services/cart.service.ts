import { Injectable, inject, signal, computed } from '@angular/core';
import { ProductsService } from './products.service';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private productsService = inject(ProductsService);

  private itemsSignal = signal<CartItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private promoCodeSignal = signal<string | null>(null);
  readonly promoCode = this.promoCodeSignal.asReadonly();

  private promoErrorSignal = signal<string | null>(null);
  readonly promoError = this.promoErrorSignal.asReadonly();

  // Количество товаров
  readonly itemCount = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0)
  );

  // Подытог
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Налог (8%)
  readonly tax = computed(() => Math.round(this.subtotal() * 0.08 * 100) / 100);

  // Скидка
  readonly discount = computed(() => {
    if (this.promoCodeSignal() === 'SAVE10') {
      return Math.round(this.subtotal() * 0.1 * 100) / 100;
    }
    return 0;
  });

  // Итого
  readonly total = computed(() => {
    return Math.round((this.subtotal() + this.tax() - this.discount()) * 100) / 100;
  });

  // Корзина пуста
  readonly isEmpty = computed(() => this.itemsSignal().length === 0);

  // Добавить товар
  addItem(productId: number): void {
    const product = this.productsService.getProductById(productId);
    if (!product) return;

    const existing = this.itemsSignal().find(item => item.productId === productId);
    if (existing) {
      this.itemsSignal.update(items =>
        items.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      this.itemsSignal.update(items => [
        ...items,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: this.getCategoryLabel(product.category),
          quantity: 1
        }
      ]);
    }
  }

  // Удалить товар
  removeItem(productId: number): void {
    this.itemsSignal.update(items =>
      items.filter(item => item.productId !== productId)
    );
    this.promoErrorSignal.set(null);
  }

  // Обновить количество
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.itemsSignal.update(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  }

  // Увеличить количество
  increment(productId: number): void {
    this.itemsSignal.update(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  // Уменьшить количество
  decrement(productId: number): void {
    this.itemsSignal.update(items =>
      items.map(item =>
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }

  // Применить промокод
  applyPromoCode(code: string): void {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode === 'SAVE10') {
      this.promoCodeSignal.set('SAVE10');
      this.promoErrorSignal.set(null);
    } else {
      this.promoCodeSignal.set(null);
      this.promoErrorSignal.set('Неверный промокод');
    }
  }

  // Убрать промокод
  clearPromoCode(): void {
    this.promoCodeSignal.set(null);
    this.promoErrorSignal.set(null);
  }

  // Очистить корзину
  clearCart(): void {
    this.itemsSignal.set([]);
    this.promoCodeSignal.set(null);
    this.promoErrorSignal.set(null);
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'food': 'Food',
      'toy': 'Toys',
      'accessory': 'Accessories',
      'beds': 'Beds',
      'furniture': 'Furniture'
    };
    return labels[category] || category;
  }
}
