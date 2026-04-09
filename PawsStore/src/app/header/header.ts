import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {

  isMobileMenuOpen = signal(false);
  
  // Навигационные ссылки
  navLinks = [
    { label: 'Shop', path: '/catalog' },
    { label: 'Categories', path: '/catalog' },
    { label: 'Deals', path: '/catalog' },
    { label: 'About', path: '/catalog' }
  ];
  
  // Переключение мобильного меню
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }
  
  // Закрытие меню при клике на ссылку
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}