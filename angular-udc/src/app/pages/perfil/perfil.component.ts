import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';

@Component({
  selector: 'app-perfil',
  imports: [CollapsiblePanelComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent {
  readonly auth = inject(AuthService);

  get access(): { icon: string; title: string; text: string }[] {
    const role = this.auth.user()?.rol;
    const common = [
      { icon: 'bi-speedometer2', title: 'Dashboard', text: 'Resumen general de actividad deportiva.' },
      { icon: 'bi-calendar3', title: 'Calendario', text: 'Consulta la agenda y próximos encuentros.' },
    ];

    if (role === 'ADMIN') {
      return [
        ...common,
        { icon: 'bi-people', title: 'Usuarios', text: 'Gestión completa de roles y cuentas.' },
        { icon: 'bi-person-badge', title: 'Árbitros', text: 'Administración del colegio arbitral.' },
      ];
    }

    if (role === 'COORDINADOR_ARBITROS') {
      return [
        ...common,
        { icon: 'bi-calendar-check', title: 'Asignaciones', text: 'Asignación y seguimiento arbitral.' },
        { icon: 'bi-person-badge', title: 'Árbitros', text: 'Disponibilidad, categorías y competencias.' },
      ];
    }

    if (role === 'ORGANIZADOR') {
      return [
        ...common,
        { icon: 'bi-trophy', title: 'Partidos', text: 'Creación y seguimiento de encuentros.' },
      ];
    }

    if (role === 'ESPECTADOR') {
      return [
        ...common,
        { icon: 'bi-trophy', title: 'Partidos', text: 'Consulta encuentros y resultados disponibles.' },
      ];
    }

    return [
      ...common,
      { icon: 'bi-calendar-check', title: 'Mis asignaciones', text: 'Confirmación o rechazo de partidos asignados.' },
    ];
  }
}
