import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import type { AuthUser } from './auth.models';
import { AuthService } from './auth.service';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  role: 'customer',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('logs in, stores the token and exposes the user', () => {
    let result: AuthUser | undefined;

    service.login('customer@example.com', 'secret123').subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'customer@example.com',
      password: 'secret123',
    });

    request.flush({ token: 'jwt-token', user });

    expect(result).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.token()).toBe('jwt-token');
    expect(localStorage.getItem('pawsstore.auth.token')).toBe('jwt-token');
  });

  it('surfaces the backend error and stays anonymous', () => {
    let message = '';

    service.login('customer@example.com', 'wrong-pass').subscribe({
      error: (error: Error) => {
        message = error.message;
      },
    });

    http
      .expectOne(`${environment.apiUrl}/api/auth/login`)
      .flush({ message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });

    expect(message).toBe('Invalid email or password');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('registers and then logs the new user in', () => {
    service.register('new@example.com', 'secret123').subscribe();

    const register = http.expectOne(`${environment.apiUrl}/api/auth/register`);
    expect(register.request.method).toBe('POST');
    register.flush({ user: { ...user, email: 'new@example.com' } }, { status: 201, statusText: 'Created' });

    const login = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    login.flush({ token: 'new-token', user: { ...user, email: 'new@example.com' } });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.email).toBe('new@example.com');
    expect(localStorage.getItem('pawsstore.auth.token')).toBe('new-token');
  });

  it('clears the session on logout', () => {
    service.login('customer@example.com', 'secret123').subscribe();
    http.expectOne(`${environment.apiUrl}/api/auth/login`).flush({ token: 'jwt-token', user });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('pawsstore.auth.token')).toBeNull();
  });
});
