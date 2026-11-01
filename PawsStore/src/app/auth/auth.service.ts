import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AuthUser, LoginResponse, RegisterResponse } from './auth.models';
import { AuthStorageService } from './auth-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.storage.getToken());
  private readonly userSignal = signal<AuthUser | null>(this.storage.getUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((response) => this.setSession(response.token, response.user)),
        map((response) => response.user),
        catchError((error: unknown) => this.handleError(error)),
      );
  }

  register(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<RegisterResponse>(`${environment.apiUrl}/api/auth/register`, {
        email,
        password,
      })
      .pipe(
        switchMap(() => this.login(email, password)),
        catchError((error: unknown) => this.handleError(error)),
      );
  }

  logout(): void {
    this.storage.clear();
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/');
  }

  private setSession(token: string, user: AuthUser): void {
    this.storage.save(token, user);
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => new Error(this.extractMessage(error)));
  }

  private extractMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the server. Please try again later.';
      }

      const body = error.error as { message?: string } | null;
      return body?.message ?? `Request failed (${error.status})`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected error. Please try again.';
  }
}
