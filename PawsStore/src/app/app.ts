import { Component, signal } from '@angular/core';
import { HeaderComponent } from './header/header';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer';
import { ProductPageComponent } from './product-page/product-page';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterOutlet, FooterComponent, ProductPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PawsStore');
}
