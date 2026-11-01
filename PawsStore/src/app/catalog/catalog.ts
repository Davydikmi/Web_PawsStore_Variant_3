import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../models/product';
import { CartService } from '../services/cart.service';
import { ProductQuery, ProductsService } from '../services/products.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit, OnDestroy {
  public productsService = inject(ProductsService);
  public cartService = inject(CartService);

  readonly limit = 12;

  // Фильтры
  showFilters = signal(false); // Для мобильного
  selectedRatings = signal<number[]>([]);
  priceMin = signal<number>(0);
  priceMax = signal<number>(1000);
  sortBy = signal('name-asc');
  searchTerm = signal('');

  // Пагинация
  currentPage = signal(1);
  readonly meta = this.productsService.meta;
  readonly pageNumbers = computed(() => {
    const total = this.meta().total_pages;

    if (total <= 0) {
      return [];
    }

    const current = Math.min(this.currentPage(), total);
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  readonly isLoading = this.productsService.isLoading;
  readonly error = this.productsService.error;

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.loadCurrentPage();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  toggleRating(rating: number): void {
    const current = this.selectedRatings();
    if (current.includes(rating)) {
      this.selectedRatings.set(current.filter(r => r !== rating));
    } else {
      this.selectedRatings.set([...current, rating]);
    }
    this.applyFilters();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    void this.loadCurrentPage();
  }

  reload(): void {
    void this.loadCurrentPage();
  }

  goToPage(page: number): void {
    const totalPages = this.meta().total_pages;

    if (page < 1 || page > totalPages || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    void this.loadCurrentPage();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.selectedRatings.set([]);
    this.priceMin.set(0);
    this.priceMax.set(1000);
    this.sortBy.set('name-asc');
    this.searchTerm.set('');
    this.showFilters.set(false);
    this.applyFilters();
  }

  // Отображение звезд у карточки товара
  getStars(rating: number): Array<'full' | 'half' | 'empty'> {
    const stars: Array<'full' | 'half' | 'empty'> = [];
    
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Полная звезда
        stars.push('full');
      } else if (rating >= i - 0.5) {
        // Половина звезды
        stars.push('half');
      } else {
        // Пустая звезда
        stars.push('empty');
      }
    }
    
    return stars;
  }

  addToCart(product: Product): void {
    void this.cartService.addItem(product.id);
  }

  private async loadCurrentPage(): Promise<void> {
    await this.productsService.loadProducts(this.buildQuery());
  }

  private buildQuery(): ProductQuery {
    const sorts: Record<string, { sortBy: 'price' | 'title' | 'rating'; order: 'asc' | 'desc' }> = {
      'name-asc': { sortBy: 'title', order: 'asc' },
      'name-desc': { sortBy: 'title', order: 'desc' },
      'price-asc': { sortBy: 'price', order: 'asc' },
      'price-desc': { sortBy: 'price', order: 'desc' },
      'rating': { sortBy: 'rating', order: 'desc' },
    };
    const sort = sorts[this.sortBy()] ?? sorts['name-asc'];
    const ratings = this.selectedRatings();

    return {
      page: this.currentPage(),
      limit: this.limit,
      search: this.searchTerm().trim() || undefined,
      minPrice: this.priceMin() > 0 ? this.priceMin() : undefined,
      maxPrice: this.priceMax() < 1000 ? this.priceMax() : undefined,
      minRating: ratings.length > 0 ? Math.min(...ratings) : undefined,
      sortBy: sort.sortBy,
      order: sort.order,
    };
  }
}
