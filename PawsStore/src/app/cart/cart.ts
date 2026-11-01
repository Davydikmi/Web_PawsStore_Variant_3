import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent {
  public cartService = inject(CartService);
  promoInput = '';

  async applyPromo(): Promise<void> {
    const code = this.promoInput.trim();

    if (!code) {
      return;
    }

    await this.cartService.applyPromoCode(code);

    if (!this.cartService.promoError()) {
      this.promoInput = '';
    }
  }
}
