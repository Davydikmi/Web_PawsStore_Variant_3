import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  // Навигационные ссылки
  quickLinks = [
    { label: 'Shop All', path: '/catalog' },
    { label: 'New Arrivals', path: '/catalog' },
    { label: 'Best Sellers', path: '/catalog' },
    { label: 'Sale Items', path: '/catalog' }
  ];

  customerServiceLinks = [
    { label: 'Contact Us', path: '/contact' },
    { label: 'Shipping Info', path: '/shipping' },
    { label: 'Returns Policy', path: '/returns' },
    { label: 'FAQ', path: '/faq' }
  ];

  // Социальные сети
  socialLinks = [
    { name: 'Facebook', icon: 'facebook', url: '#' },
    { name: 'Twitter', icon: 'twitter', url: '#' },
    { name: 'Instagram', icon: 'instagram', url: '#' }
  ];

  // Email для подписки
  newsletterEmail = '';

  // Подписка на рассылку
  subscribeNewsletter(): void {
    if (this.newsletterEmail && this.isValidEmail(this.newsletterEmail)) {
      console.log('Подписка на рассылку:', this.newsletterEmail);
      // Здесь будет логика отправки на сервер
      this.newsletterEmail = '';
      alert('✅ Спасибо за подписку!');
    } else {
      alert('❌ Пожалуйста, введите корректный email');
    }
  }

  // Валидация email
  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}