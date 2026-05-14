import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Match } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatchCardComponent } from '../../shared/components/match-card/match-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-partidos',
  imports: [FormsModule, CollapsiblePanelComponent, EmptyStateComponent, MatchCardComponent, StatusBadgeComponent],
  templateUrl: './partidos.component.html',
})
export class PartidosComponent implements OnInit {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly partidos = signal<Match[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editingId = signal<number | null>(null);
  readonly metrics = computed(() => {
    const partidos = this.partidos();
    const programados = partidos.filter((p) => p.estado === 'PROGRAMADO').length;
    const completos = partidos.filter((p) => (p.arbitrosAsignados ?? 0) >= (p.arbitrosRequeridos ?? p.plazasArbitralesSolicitadas ?? 1)).length;
    const incompletos = partidos.length - completos;

    return { total: partidos.length, programados, completos, incompletos };
  });

  filters = {
    q: '',
    estado: '',
    deporte: '',
  };

  form: Partial<Match> & { fechaLocal?: string } = this.emptyForm();

  ngOnInit(): void {
    void this.load();
  }

  get canManage(): boolean {
    return ['ADMIN', 'ORGANIZADOR'].includes(this.auth.user()?.rol ?? '');
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.partidos.set(await this.api.partidos(this.filters));
    } catch {
      this.error.set('No se pudieron cargar los partidos.');
    } finally {
      this.loading.set(false);
    }
  }

  edit(partido: Match): void {
    this.editingId.set(partido.id);
    const fecha = partido.fecha ?? partido.fechaInicio ?? '';
    this.form = {
      equipoLocal: partido.equipoLocal ?? partido.equipoLocalNombre ?? '',
      equipoVisitante: partido.equipoVisitante ?? partido.equipoVisitanteNombre ?? '',
      deporte: partido.deporte ?? 'FUTBOL',
      competicion: partido.competicion ?? '',
      lugar: partido.lugar ?? '',
      fechaLocal: fecha ? this.toDatetimeLocal(fecha) : '',
      estado: partido.estado ?? 'PROGRAMADO',
      arbitrosRequeridos: partido.arbitrosRequeridos ?? partido.plazasArbitralesSolicitadas ?? 1,
      observaciones: partido.observaciones ?? '',
    };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    const payload = {
      ...this.form,
      fecha: this.form.fechaLocal,
      fechaInicio: this.form.fechaLocal,
      plazasArbitralesSolicitadas: Number(this.form.arbitrosRequeridos ?? 1),
      arbitrosRequeridos: Number(this.form.arbitrosRequeridos ?? 1),
    };

    delete payload.fechaLocal;

    try {
      const id = this.editingId();
      if (id) {
        await this.api.actualizarPartido(id, payload);
      } else {
        await this.api.crearPartido(payload);
      }
      this.cancelEdit();
      await this.load();
    } catch {
      this.error.set('No se pudo guardar el partido. Revisa los campos obligatorios.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(partido: Match): Promise<void> {
    if (!confirm(`Eliminar ${this.matchTitle(partido)}?`)) return;

    try {
      await this.api.eliminarPartido(partido.id);
      await this.load();
    } catch {
      this.error.set('No se pudo eliminar el partido.');
    }
  }

  matchTitle(match: Match): string {
    const local = match.equipoLocal ?? match.equipoLocalNombre ?? 'Equipo local';
    const visitante = match.equipoVisitante ?? match.equipoVisitanteNombre ?? 'Equipo visitante';
    return `${local} vs ${visitante}`;
  }

  matchDate(match: Match): string {
    const date = match.fecha ?? match.fechaInicio;
    if (!date) return 'Fecha pendiente';

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

  private emptyForm(): Partial<Match> & { fechaLocal?: string } {
    return {
      equipoLocal: '',
      equipoVisitante: '',
      deporte: 'FUTBOL',
      competicion: '',
      lugar: '',
      fechaLocal: '',
      estado: 'PROGRAMADO',
      arbitrosRequeridos: 1,
      observaciones: '',
    };
  }

  private toDatetimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
