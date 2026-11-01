import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Product,
  ProductCategory,
  ProductSpecifications,
} from '../models/product';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: ProductCategory;
  sortBy?: 'price' | 'title' | 'rating';
  order?: 'asc' | 'desc';
}

export interface ProductsMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

interface ApiProduct {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  rating: number;
  reviews?: number;
  images: string[];
  highlights?: string[];
  specifications?: Record<string, unknown> | null;
  category?: ProductCategory | null;
  stockQuantity: number;
}

interface ApiProductsResponse {
  items: ApiProduct[];
  meta: ProductsMeta;
}

const EMPTY_META: ProductsMeta = {
  total_items: 0,
  total_pages: 0,
  current_page: 1,
  limit: 12,
};

const FALLBACK_IMAGE = '/assets/images/bed.jpg';

function mapProduct(api: ApiProduct): Product {
  const images = api.images?.length ? api.images : [FALLBACK_IMAGE];

  return {
    id: api.id,
    name: api.title,
    price: api.price,
    rating: api.rating,
    reviews: api.reviews ?? 0,
    image: images[0],
    images,
    shortDescription: api.shortDescription ?? api.description,
    fullDescription: api.description,
    highlights: api.highlights ?? [],
    specifications: (api.specifications ?? {}) as ProductSpecifications,
    category: api.category ?? 'food',
    stockQuantity: api.stockQuantity,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly productsSignal = signal<Product[]>([]);
  readonly productsList = this.productsSignal.asReadonly();

  private readonly metaSignal = signal<ProductsMeta>(EMPTY_META);
  readonly meta = this.metaSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly isLoading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  async loadProducts(query: ProductQuery = {}): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<ApiProductsResponse>(`${environment.apiUrl}/api/products`, {
          params: this.buildParams(query),
        }),
      );

      this.productsSignal.set(response.items.map(mapProduct));
      this.metaSignal.set(response.meta);
    } catch (error) {
      console.error('Failed to load products:', error);
      this.errorSignal.set('Failed to load products. Please try again.');
      this.productsSignal.set([]);
      this.metaSignal.set(EMPTY_META);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadProduct(id: string): Promise<Product | null> {
    try {
      const product = await firstValueFrom(
        this.http.get<ApiProduct>(`${environment.apiUrl}/api/products/${id}`),
      );

      return mapProduct(product);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async loadRelatedProducts(
    category: ProductCategory,
    excludeId: string,
    limit = 4,
  ): Promise<Product[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiProductsResponse>(`${environment.apiUrl}/api/products`, {
          params: this.buildParams({
            category,
            limit: limit + 1,
            sortBy: 'rating',
            order: 'desc',
          }),
        }),
      );

      return response.items
        .map(mapProduct)
        .filter((product) => product.id !== excludeId)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  getProductById(id: string): Product | undefined {
    return this.productsSignal().find((product) => product.id === id);
  }

  private buildParams(query: ProductQuery): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('limit', String(query.limit ?? 12));

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.minPrice !== undefined) {
      params = params.set('min_price', String(query.minPrice));
    }

    if (query.maxPrice !== undefined) {
      params = params.set('max_price', String(query.maxPrice));
    }

    if (query.minRating !== undefined) {
      params = params.set('min_rating', String(query.minRating));
    }

    if (query.category) {
      params = params.set('category', query.category);
    }

    if (query.sortBy) {
      params = params.set('sort_by', query.sortBy);
    }

    if (query.order) {
      params = params.set('order', query.order);
    }

    return params;
  }
}
