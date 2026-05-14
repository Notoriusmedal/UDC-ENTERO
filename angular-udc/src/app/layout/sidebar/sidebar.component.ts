import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';

type NavItem = {
  label: string;
  icon: string;
  link: string;
  roles?: string[];
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  readonly mainItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', link: '/dashboard' },
    { label: 'Partidos', icon: 'bi-trophy', link: '/partidos' },
    { label: 'Árbitros', icon: 'bi-person-badge', link: '/arbitros', roles: ['ADMIN', 'COORDINADOR_ARBITROS'] },
    { label: 'Asignaciones', icon: 'bi-calendar-check', link: '/asignaciones' },
    { label: 'Calendario', icon: 'bi-calendar3', link: '/calendario' },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Usuarios', icon: 'bi-people', link: '/usuarios', roles: ['ADMIN'] },
    { label: 'Mi perfil', icon: 'bi-person-circle', link: '/perfil' },
  ];

  canShow(item: NavItem): boolean {
    return !item.roles || item.roles.includes(this.auth.user()?.rol ?? '');
  }
}
