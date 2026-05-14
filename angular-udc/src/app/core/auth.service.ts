import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenKey = 'udc_token';

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly loginError = signal('');
  readonly isAuthenticated = computed(() => !!this.user());

  async restoreSession(): Promise<void> {
    if (!localStorage.getItem(this.tokenKey)) return;

    try {
      this.user.set(await this.api.me());
    } catch {
      this.logout();
    }
  }

  async login(username: string, password: string): Promise<void> {
    this.loading.set(true);
    this.loginError.set('');

    try {
      const response = await this.api.login(username, password);
      localStorage.setItem(this.tokenKey, response.accessToken);
      this.user.set(await this.api.me());
    } catch {
      this.loginError.set('Usuario o contraseña incorrectos, o backend no disponible.');
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.user.set(null);
  }

  fullName(): string {
    const user = this.user();
    return `${user?.nombre ?? ''} ${user?.apellidos ?? ''}`.trim() || user?.username || 'Usuario';
  }

  initials(): string {
    const user = this.user();
    return `${user?.nombre?.[0] ?? ''}${user?.apellidos?.[0] ?? ''}`.toUpperCase() || 'U';
  }

  roleLabel(role = this.user()?.rol): string {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      COORDINADOR_ARBITROS: 'Coordinador',
      ORGANIZADOR: 'Organizador',
      ARBITRO: 'Árbitro',
    };

    return labels[role ?? ''] ?? role ?? '—';
  }
}
