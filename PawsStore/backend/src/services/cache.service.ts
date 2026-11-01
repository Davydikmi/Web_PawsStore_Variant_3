import { getRedis } from '../lib/redis.js';

const PRODUCTS_CACHE_PREFIX = 'products:';
const PRODUCTS_CACHE_TTL_SECONDS = 120;
const SCAN_BATCH_SIZE = 100;

export interface ProductsCacheParams {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: string;
  sortBy?: 'price' | 'title';
  order?: 'asc' | 'desc';
}

export function buildProductsCacheKey(params: ProductsCacheParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.minPrice !== undefined) {
    searchParams.set('min_price', String(params.minPrice));
  }

  if (params.maxPrice !== undefined) {
    searchParams.set('max_price', String(params.maxPrice));
  }

  if (params.minRating !== undefined) {
    searchParams.set('min_rating', String(params.minRating));
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.sortBy) {
    searchParams.set('sort_by', params.sortBy);
  }

  if (params.order) {
    searchParams.set('order', params.order);
  }

  searchParams.sort();

  return `${PRODUCTS_CACHE_PREFIX}${searchParams.toString()}`;
}

export async function readProductsCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await getRedis().get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (error) {
    console.error(`[cache] read failed: ${(error as Error).message}`);
    return null;
  }
}

export async function writeProductsCache(key: string, value: unknown): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', PRODUCTS_CACHE_TTL_SECONDS);
  } catch (error) {
    console.error(`[cache] write failed: ${(error as Error).message}`);
  }
}

export async function invalidateProductsCache(): Promise<void> {
  try {
    const redis = getRedis();
    const keysToDelete: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${PRODUCTS_CACHE_PREFIX}*`,
        'COUNT',
        SCAN_BATCH_SIZE,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        keysToDelete.push(...keys);
      }
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    console.error(`[cache] invalidation failed: ${(error as Error).message}`);
  }
}
