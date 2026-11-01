import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import type { AuthUser } from './auth.models';

const TOKEN_KEY = 'pawsstore.auth.token';
const USER_KEY = 'pawsstore.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null;
  }

  getToken(): string | null {
    try {
      return this.storage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }

  getUser(): AuthUser | null {
    try {
      const raw = this.storage?.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  save(token: string, user: AuthUser): void {
    try {
      this.storage?.setItem(TOKEN_KEY, token);
      this.storage?.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Storage can be unavailable (private mode); auth still works in memory.
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(TOKEN_KEY);
      this.storage?.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors.
    }
  }
}
