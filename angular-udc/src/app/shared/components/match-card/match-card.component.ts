import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../../core/models';
import { teamLogoUrl } from '../../../core/team-logos';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-match-card',
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.css',
})
export class MatchCardComponent {
  @Input({ required: true }) match!: Match;
  @Input() showDetail = true;

  get teams(): { home: string; away: string } {
    if (this.match.equipoLocal || this.match.equipoVisitante || this.match.equipoLocalNombre || this.match.equipoVisitanteNombre) {
      return {
        home: this.match.equipoLocal ?? this.match.equipoLocalNombre ?? 'Equipo local',
        away: this.match.equipoVisitante ?? this.match.equipoVisitanteNombre ?? 'Equipo visitante',
      };
    }

    const title = this.match.nombre || 'Partido pendiente';
    const parts = title.split(/\s+vs\s+/i);
    return {
      home: parts[0] ?? title,
      away: parts[1] ?? 'Rival por confirmar',
    };
  }

  get refereeCoverage(): string {
    const assigned = this.match.arbitrosAsignados ?? 0;
    const required = this.match.arbitrosRequeridos ?? this.match.plazasArbitralesSolicitadas ?? 0;
    return required ? `${assigned}/${required}` : `${assigned}`;
  }

  get formattedDate(): string {
    const date = this.match.fecha ?? this.match.fechaInicio;

    if (!date) {
      return 'Fecha pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }

  get formattedTime(): string {
    const date = this.match.fecha ?? this.match.fechaInicio;

    if (!date) {
      return 'Hora pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  get categoryLabel(): string {
    return this.match.categoria ?? this.match.competicion ?? 'Categoría general';
  }

  teamLogo(teamName?: string | null, fallbackIndex = 0): string {
    return teamLogoUrl(teamName, fallbackIndex);
  }
}
