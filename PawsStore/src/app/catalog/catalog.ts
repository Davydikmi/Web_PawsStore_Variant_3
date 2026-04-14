import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../services/products.service';
import { Product } from '../models/product';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  public productsService = inject(ProductsService);

  ngOnInit(): void {
    this.productsService.loadProducts();
  }

  // Фильтры
  showFilters = signal(false); // Для мобильного
  selectedRatings = signal<number[]>([]);
  priceMin = signal<number>(0);
  priceMax = signal<number>(200);
  sortBy = signal('name-asc');

  filteredProducts = computed(() => {
    let result = [...this.productsService.productsList()];

    // Рейтинг
    if (this.selectedRatings().length > 0) {
      result = result.filter(p => 
        this.selectedRatings().some(rating => p.rating >= rating)
      );
    }

    // Цена
    result = result.filter(p => 
      p.price >= this.priceMin() && p.price <= this.priceMax()
    );

    // Сортировка
    switch (this.sortBy()) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  });

  isLoading = this.productsService.isLoading;
  error = this.productsService.error;

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
  }

  resetFilters(): void {
    this.selectedRatings.set([]);
    this.priceMin.set(0);
    this.priceMax.set(200);
    this.sortBy.set('name-asc');
    this.showFilters.set(false);
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
}