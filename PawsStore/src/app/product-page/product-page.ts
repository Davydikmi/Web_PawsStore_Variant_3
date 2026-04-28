import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss'
})
export class ProductPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  public cartService = inject(CartService);

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  quantity = signal(1);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentImageIndex = signal(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      
      if (!id) {
        this.error.set('Product not found');
        this.isLoading.set(false);
        return;
      }

      const foundProduct = this.productsService.getProductById(id);
      
      if (foundProduct) {
        this.product.set(foundProduct);
        this.loadRelatedProducts(foundProduct.category, foundProduct.id);
        this.currentImageIndex.set(0);
        this.quantity.set(1);
      } else {
        // Если продукт не найден, загружаем и пробуем снова
        this.productsService.loadProducts().then(() => {
          const retryProduct = this.productsService.getProductById(id);
          if (retryProduct) {
            this.product.set(retryProduct);
            this.loadRelatedProducts(retryProduct.category, retryProduct.id);
            this.currentImageIndex.set(0);
            this.quantity.set(1);
          } else {
            this.error.set('Product not found');
          }
        });
      }
      
      this.isLoading.set(false);
    });
  }

  private loadRelatedProducts(category: string, excludeId: number): void {
    const related = this.productsService.getRelatedProducts(category, excludeId);
    this.relatedProducts.set(related);
  }

  incrementQuantity(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  prevImage(): void {
    const product = this.product();
    if (!product) return;
    this.currentImageIndex.update(i => (i - 1 + product.images.length) % product.images.length);
  }

  nextImage(): void {
    const product = this.product();
    if (!product) return;
    this.currentImageIndex.update(i => (i + 1) % product.images.length);
  }

  goToImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;
    
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.addItem(product.id);
    }
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    this.prevImage();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    this.nextImage();
  }

  getStarsArray(rating: number): Array<'full' | 'half' | 'empty'> {
    const stars: Array<'full' | 'half' | 'empty'> = [];
    
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('full');
      } else if (rating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'leashes': 'Leashes',
      'toy': 'Toys',
      'bowls': 'Bowls',
      'beds': 'Beds',
      'travel': 'Travel'
    };
    return labels[category] || category;
  }

  getProductSpecs(): Array<{ label: string; value: string }> {
    const product = this.product();
    if (!product || !product.specifications) {
      return [];
    }

    const specs: Array<{ label: string; value: string }> = [];
    const specLabels: Record<string, string> = {
      'size': 'Dimensions',
      'foamThickness': 'Foam Thickness',
      'coverMaterial': 'Cover Material',
      'washing': 'Washing',
      'weight': 'Weight',
      'mainIngredient': 'Main Ingredient',
      'lifeStage': 'Life Stage',
      'breedSize': 'Breed Size',
      'material': 'Material',
      'recommendedFor': 'Recommended For',
      'color': 'Color',
      'dishwasherSafe': 'Dishwasher Safe',
      'quantity': 'Quantity',
      'maxCatWeight': 'Max Cat Weight',
      'assembly': 'Assembly',
      'grainFree': 'Grain Free',
      'shelfLife': 'Shelf Life'
    };

    for (const [key, value] of Object.entries(product.specifications)) {
      const label = specLabels[key] || key;
      const displayValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No')
        : String(value);
      
      specs.push({ label, value: displayValue });
    }

    return specs;
  }
}
