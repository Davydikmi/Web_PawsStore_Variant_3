import { Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog';
import { ProductPageComponent } from './product-page/product-page';
import { CartComponent } from './cart/cart';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'product/:id', component: ProductPageComponent },
  { path: 'cart', component: CartComponent },
  { path: '**', redirectTo: '' }
];
