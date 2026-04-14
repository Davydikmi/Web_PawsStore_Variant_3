import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private productsSignal = signal<Product[]>([]);
  readonly productsList = this.productsSignal.asReadonly();

  private loadingSignal = signal(false);
  readonly isLoading = this.loadingSignal.asReadonly();

  private errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  async loadProducts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const data: any = await firstValueFrom(
        this.http.get('/assets/data/products.json')
      );
      this.productsSignal.set(data.products);

    } catch (err) {
      console.error('Failed to load products:', err);
      this.errorSignal.set('Failed to load products');
      this.productsSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  getProductById(id: number): Product | undefined {
    return this.productsSignal().find(p => p.id === id);
  }
}