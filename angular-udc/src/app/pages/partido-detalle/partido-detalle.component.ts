import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Match } from '../../core/models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-partido-detalle',
  imports: [RouterLink, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './partido-detalle.component.html',
  styleUrl: './partido-detalle.component.css',
})
export class PartidoDetalleComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly partido = signal<Match | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No se encontró el partido seleccionado.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      this.partido.set(await this.api.partido(id));
    } catch {
      this.error.set('No se pudo cargar la información del partido.');
    } finally {
      this.loading.set(false);
    }
  }

  matchTitle(match: Match): string {
    return `${this.localTeam(match)} vs ${this.awayTeam(match)}`;
  }

  localTeam(match: Match): string {
    return match.equipoLocal ?? match.equipoLocalNombre ?? 'Equipo local';
  }

  awayTeam(match: Match): string {
    return match.equipoVisitante ?? match.equipoVisitanteNombre ?? 'Equipo visitante';
  }

  fullDate(match: Match): string {
    const date = match.fecha ?? match.fechaInicio;
    if (!date) return 'Fecha pendiente';

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  shortDate(match: Match): string {
    const date = match.fecha ?? match.fechaInicio;
    if (!date) return 'Por confirmar';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  coverage(match: Match): string {
    const assigned = match.arbitrosAsignados ?? 0;
    const required = match.arbitrosRequeridos ?? match.plazasArbitralesSolicitadas ?? 0;
    return required ? `${assigned}/${required}` : `${assigned}`;
  }

  coverageText(match: Match): string {
    const assigned = match.arbitrosAsignados ?? 0;
    const required = match.arbitrosRequeridos ?? match.plazasArbitralesSolicitadas ?? 0;

    if (!required) return 'Cobertura arbitral por confirmar';
    if (assigned >= required) return 'Cobertura arbitral completa';
    return `Faltan ${required - assigned} árbitro${required - assigned === 1 ? '' : 's'} por asignar`;
  }

  mapsUrl(match: Match): string {
    const place = match.lugar || 'Canarias';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Canarias`)}`;
  }
}
