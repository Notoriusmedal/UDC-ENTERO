import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

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

  todayLabel(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
