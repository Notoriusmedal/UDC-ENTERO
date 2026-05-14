import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Arbitro, Asignacion, Match } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

type Sugerencia = {
  arbitro: Arbitro;
  puntos: number;
  motivos: string[];
};

@Component({
  selector: 'app-asignaciones',
  imports: [FormsModule, CollapsiblePanelComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './asignaciones.component.html',
})
export class AsignacionesComponent implements OnInit {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly asignaciones = signal<Asignacion[]>([]);
  readonly partidos = signal<Match[]>([]);
  readonly arbitros = signal<Arbitro[]>([]);
  readonly sugerencias = signal<Sugerencia[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly metrics = computed(() => {
    const asignaciones = this.asignaciones();
    return {
      total: asignaciones.length,
      pendientes: asignaciones.filter((a) => a.estado === 'PENDIENTE').length,
      confirmadas: asignaciones.filter((a) => a.estado === 'CONFIRMADO').length,
      rechazadas: asignaciones.filter((a) => a.estado === 'RECHAZADO').length,
    };
  });

  filters = {
    estado: '',
  };

  form = {
    partidoId: '',
    arbitroId: '',
    rol: 'Principal',
    observaciones: '',
  };

  ngOnInit(): void {
    void this.loadAll();
  }

  get canManage(): boolean {
    return ['ADMIN', 'COORDINADOR_ARBITROS'].includes(this.auth.user()?.rol ?? '');
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [asignaciones, partidos, arbitros] = await Promise.all([
        this.api.asignaciones(this.filters),
        this.api.partidos({ estado: 'PROGRAMADO' }),
        this.api.arbitros({ disponibilidad: 'DISPONIBLE' }),
      ]);
      this.asignaciones.set(asignaciones);
      this.partidos.set(partidos);
      this.arbitros.set(arbitros);
    } catch {
      this.error.set('No se pudieron cargar las asignaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.api.crearAsignacion(this.form);
      this.form = { partidoId: '', arbitroId: '', rol: 'Principal', observaciones: '' };
      this.sugerencias.set([]);
      await this.loadAll();
    } catch {
      this.error.set('No se pudo crear la asignación. Puede haber un conflicto horario o datos incompletos.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(asignacion: Asignacion): Promise<void> {
    if (!confirm('Eliminar esta asignación?')) return;

    try {
      await this.api.eliminarAsignacion(asignacion.id);
      await this.loadAll();
    } catch {
      this.error.set('No se pudo eliminar la asignación.');
    }
  }

  async confirmar(asignacion: Asignacion): Promise<void> {
    try {
      await this.api.confirmarAsignacion(asignacion.id);
      await this.loadAll();
    } catch {
      this.error.set('No se pudo confirmar la asignación.');
    }
  }

  async rechazar(asignacion: Asignacion): Promise<void> {
    try {
      await this.api.rechazarAsignacion(asignacion.id);
      await this.loadAll();
    } catch {
      this.error.set('No se pudo rechazar la asignación.');
    }
  }

  async sugerir(): Promise<void> {
    this.error.set('');
    this.sugerencias.set([]);

    const partido = this.partidos().find((item) => String(item.id) === String(this.form.partidoId));
    if (!partido) {
      this.error.set('Selecciona primero un partido.');
      return;
    }

    try {
      const fecha = partido.fecha ?? partido.fechaInicio;
      const arbitros = fecha ? await this.api.arbitrosDisponibles(fecha) : await this.api.arbitros({ disponibilidad: 'DISPONIBLE' });
      const asignaciones = await this.api.asignaciones({ size: 500 });

      const sugerencias = arbitros
        .map((arbitro) => this.score(arbitro, partido, asignaciones))
        .filter((item): item is Sugerencia => !!item)
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, 5);

      this.sugerencias.set(sugerencias);

      if (!sugerencias.length) {
        this.error.set('No hay árbitros recomendados para este partido.');
      }
    } catch {
      this.error.set('No se pudieron calcular sugerencias.');
    }
  }

  usar(arbitro: Arbitro): void {
    this.form.arbitroId = String(arbitro.id);
  }

  assignmentTitle(asignacion: Asignacion): string {
    const p = asignacion.partido;
    return `${p?.equipoLocal ?? 'Equipo local'} vs ${p?.equipoVisitante ?? 'Equipo visitante'}`;
  }

  refereeName(asignacion: Asignacion): string {
    const a = asignacion.arbitro;
    return `${a?.nombre ?? ''} ${a?.apellidos ?? ''}`.trim() || 'Árbitro';
  }

  partidoLabel(partido: Match): string {
    const local = partido.equipoLocal ?? partido.equipoLocalNombre ?? 'Equipo local';
    const visitante = partido.equipoVisitante ?? partido.equipoVisitanteNombre ?? 'Equipo visitante';
    return `${local} vs ${visitante}`;
  }

  arbitroLabel(arbitro: Arbitro): string {
    return `${arbitro.nombre ?? ''} ${arbitro.apellidos ?? ''}`.trim();
  }

  dateLabel(value?: string): string {
    if (!value) return 'Fecha pendiente';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private score(arbitro: Arbitro, partido: Match, asignaciones: Asignacion[]): Sugerencia | null {
    if (arbitro.disponibilidad !== 'DISPONIBLE') return null;

    const deporte = (partido.deporte ?? '').toUpperCase();
    const competencias = (arbitro.competencias ?? []).map((item) => item.toUpperCase());

    if (deporte && !competencias.includes(deporte)) return null;
    if (this.yaAsignado(arbitro, partido, asignaciones)) return null;

    const categoriaPuntos: Record<string, number> = {
      NACIONAL: 20,
      REGIONAL: 15,
      PROVINCIAL: 10,
      LOCAL: 5,
    };

    const total = arbitro.totalPartidos ?? 0;
    const carga = total <= 2 ? 15 : total <= 5 ? 10 : total <= 10 ? 5 : 0;
    const puntos = 30 + 25 + (categoriaPuntos[arbitro.categoria ?? ''] ?? 0) + carga;
    const motivos = [
      'Disponible',
      deporte ? `Competente en ${deporte}` : 'Competencia compatible',
      `Categoría ${arbitro.categoria ?? 'sin categoría'}`,
      carga >= 10 ? 'Baja carga de partidos' : 'Carga equilibrada',
    ];

    return { arbitro, puntos, motivos };
  }

  private yaAsignado(arbitro: Arbitro, partido: Match, asignaciones: Asignacion[]): boolean {
    return asignaciones.some((item) => String(item.partidoId ?? item.partido?.id) === String(partido.id)
      && String(item.arbitroId ?? item.arbitro?.id) === String(arbitro.id));
  }
}
