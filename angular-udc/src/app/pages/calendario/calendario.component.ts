import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Match } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

type DayGroup = {
  key: string;
  label: string;
  matches: Match[];
};

@Component({
  selector: 'app-calendario',
  imports: [FormsModule, CollapsiblePanelComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css',
})
export class CalendarioComponent implements OnInit {
  readonly api = inject(ApiService);

  readonly partidos = signal<Match[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly metrics = computed(() => {
    const partidos = this.partidos();
    return {
      total: partidos.length,
      dias: this.grouped.length,
      programados: partidos.filter((p) => p.estado === 'PROGRAMADO').length,
      directo: partidos.filter((p) => p.estado === 'EN_CURSO').length,
    };
  });

  filters = {
    estado: '',
    deporte: '',
  };

  ngOnInit(): void {
    void this.load();
  }

  get grouped(): DayGroup[] {
    const groups = new Map<string, Match[]>();

    this.partidos()
      .slice()
      .sort((a, b) => this.timestamp(a) - this.timestamp(b))
      .forEach((match) => {
        const date = this.dateValue(match);
        const key = date ? date.toISOString().slice(0, 10) : 'pendiente';
        groups.set(key, [...(groups.get(key) ?? []), match]);
      });

    return [...groups.entries()].map(([key, matches]) => ({
      key,
      label: key === 'pendiente' ? 'Fecha pendiente' : this.dayLabel(matches[0]),
      matches,
    }));
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.partidos.set(await this.api.partidos(this.filters));
    } catch {
      this.error.set('No se pudo cargar el calendario.');
    } finally {
      this.loading.set(false);
    }
  }

  title(match: Match): string {
    const local = match.equipoLocal ?? match.equipoLocalNombre ?? 'Equipo local';
    const visitante = match.equipoVisitante ?? match.equipoVisitanteNombre ?? 'Equipo visitante';
    return `${local} vs ${visitante}`;
  }

  timeLabel(match: Match): string {
    const date = this.dateValue(match);
    if (!date) return 'Sin hora';
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  coverage(match: Match): string {
    const assigned = match.arbitrosAsignados ?? 0;
    const required = match.arbitrosRequeridos ?? match.plazasArbitralesSolicitadas ?? 0;
    return required ? `${assigned}/${required}` : `${assigned}`;
  }

  private dayLabel(match: Match): string {
    const date = this.dateValue(match);
    if (!date) return 'Fecha pendiente';
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }

  private timestamp(match: Match): number {
    return this.dateValue(match)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }

  private dateValue(match: Match): Date | null {
    const raw = match.fecha ?? match.fechaInicio;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
