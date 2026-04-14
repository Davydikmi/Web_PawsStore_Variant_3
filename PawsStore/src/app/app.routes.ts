import { Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog';
import { ProductPageComponent } from './product-page/product-page';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'product/:id', component: ProductPageComponent },
  { path: '**', redirectTo: '' }
];
