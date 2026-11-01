import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface CartItem {
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
  items: CartItem[];
  promoCode: string | null;
  discountPercentage: number;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly cartSignal = signal<CartResponse | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly promoErrorSignal = signal<string | null>(null);

  readonly items = computed(() => this.cartSignal()?.items ?? []);
  readonly promoCode = computed(() => this.cartSignal()?.promoCode ?? null);
  readonly discountPercentage = computed(
    () => this.cartSignal()?.discountPercentage ?? 0,
  );
  readonly subtotal = computed(() => this.cartSignal()?.subtotal ?? 0);
  readonly discount = computed(() => this.cartSignal()?.discount ?? 0);
  readonly total = computed(() => this.cartSignal()?.total ?? 0);
  readonly itemCount = computed(() => this.cartSignal()?.itemCount ?? 0);
  readonly isEmpty = computed(() => this.items().length === 0);

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly promoError = this.promoErrorSignal.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.loadCart();
      } else {
        this.reset();
      }
    });
  }

  async loadCart(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const cart = await firstValueFrom(
        this.http.get<CartResponse>(`${environment.apiUrl}/api/cart`),
      );

      this.cartSignal.set(cart);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async addItem(productId: string, quantity = 1): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.promoErrorSignal.set(null);
    await this.mutate(
      this.http.post<CartResponse>(`${environment.apiUrl}/api/cart/items`, {
        productId,
        quantity,
      }),
    );
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    if (quantity < 1) {
      return;
    }

    await this.mutate(
      this.http.patch<CartResponse>(
        `${environment.apiUrl}/api/cart/items/${itemId}`,
        { quantity },
      ),
    );
  }

  async removeItem(itemId: string): Promise<void> {
    await this.mutate(
      this.http.delete<CartResponse>(`${environment.apiUrl}/api/cart/items/${itemId}`),
    );
  }

  increment(itemId: string): void {
    const item = this.items().find((entry) => entry.id === itemId);

    if (item) {
      void this.updateQuantity(itemId, item.quantity + 1);
    }
  }

  decrement(itemId: string): void {
    const item = this.items().find((entry) => entry.id === itemId);

    if (item && item.quantity > 1) {
      void this.updateQuantity(itemId, item.quantity - 1);
    }
  }

  async applyPromoCode(code: string): Promise<void> {
    this.promoErrorSignal.set(null);
    this.errorSignal.set(null);

    try {
      const cart = await firstValueFrom(
        this.http.post<CartResponse>(`${environment.apiUrl}/api/cart/apply-promo`, {
          code,
        }),
      );

      this.cartSignal.set(cart);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.logout();
        return;
      }

      this.promoErrorSignal.set(this.message(error));
    }
  }

  private async mutate(request: Observable<CartResponse>): Promise<void> {
    this.errorSignal.set(null);

    try {
      this.cartSignal.set(await firstValueFrom(request));
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.auth.logout();
      return;
    }

    this.errorSignal.set(this.message(error));
  }

  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the server. Please try again later.';
      }

      const body = error.error as { message?: string } | null;
      return body?.message ?? `Request failed (${error.status})`;
    }

    return 'Unexpected error. Please try again.';
  }

  private reset(): void {
    this.cartSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.promoErrorSignal.set(null);
  }
}
