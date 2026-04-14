import { Component, signal } from '@angular/core';
import { HeaderComponent } from './header/header';
import { RouterOutlet, Router } from '@angular/router';
import {FooterComponent } from "./footer/footer";
import { CatalogComponent } from './catalog/catalog';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterOutlet, FooterComponent, CatalogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PawsStore');
}
