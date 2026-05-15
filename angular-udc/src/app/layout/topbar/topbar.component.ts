import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Notificacion } from '../../core/models';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly notifications = signal<Notificacion[]>([]);
  readonly notificationsOpen = signal(false);
  readonly loadingNotifications = signal(false);
  readonly notificationsError = signal('');
  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.leida).length);

  readonly pageMap: Record<string, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Panel deportivo', breadcrumb: 'UDC / Dashboard' },
    partidos: { title: 'Partidos', breadcrumb: 'UDC / Competición' },
    arbitros: { title: 'Árbitros', breadcrumb: 'UDC / Colegio arbitral' },
    asignaciones: { title: 'Asignaciones', breadcrumb: 'UDC / Cobertura arbitral' },
    calendario: { title: 'Calendario', breadcrumb: 'UDC / Agenda' },
    usuarios: { title: 'Usuarios', breadcrumb: 'UDC / Administración' },
    perfil: { title: 'Mi perfil', breadcrumb: 'UDC / Cuenta' },
  };

  get page(): { title: string; breadcrumb: string } {
    const key = this.router.url.split('?')[0].split('/').filter(Boolean)[0] || 'dashboard';
    return this.pageMap[key] ?? this.pageMap['dashboard'];
  }

  ngOnInit(): void {
    void this.loadNotifications();
  }

  todayLabel(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async toggleNotifications(): Promise<void> {
    const next = !this.notificationsOpen();
    this.notificationsOpen.set(next);

    if (next) {
      await this.loadNotifications();
    }
  }

  async loadNotifications(): Promise<void> {
    this.loadingNotifications.set(true);
    this.notificationsError.set('');

    try {
      this.notifications.set(await this.api.notificaciones());
    } catch {
      this.notificationsError.set('No se pudieron cargar las notificaciones.');
    } finally {
      this.loadingNotifications.set(false);
    }
  }

  async markAsRead(notification: Notificacion): Promise<void> {
    if (notification.leida || !notification.id) {
      return;
    }

    try {
      const updated = await this.api.marcarNotificacionLeida(notification.id);
      this.notifications.update((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, ...updated, leida: true } : item)),
      );
    } catch {
      this.notificationsError.set('No se pudo marcar como leída.');
    }
  }

  notificationIcon(type?: string): string {
    const normalized = (type ?? '').toLowerCase();

    if (normalized.includes('asign')) return 'bi-calendar-check';
    if (normalized.includes('partido')) return 'bi-trophy';
    if (normalized.includes('rechaz')) return 'bi-x-circle';
    if (normalized.includes('confirm')) return 'bi-check-circle';
    if (normalized.includes('conflic')) return 'bi-exclamation-triangle';

    return 'bi-bell';
  }

  notificationDate(value?: string): string {
    if (!value) {
      return 'Ahora';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
