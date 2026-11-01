import { Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog';
import { ProductPageComponent } from './product-page/product-page';
import { CartComponent } from './cart/cart';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'product/:id', component: ProductPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'catalog', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
