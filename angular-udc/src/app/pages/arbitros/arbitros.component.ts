import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Arbitro } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-arbitros',
  imports: [FormsModule, CollapsiblePanelComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './arbitros.component.html',
})
export class ArbitrosComponent implements OnInit {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly arbitros = signal<Arbitro[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editingId = signal<number | null>(null);
  readonly metrics = computed(() => {
    const arbitros = this.arbitros();
    return {
      total: arbitros.length,
      disponibles: arbitros.filter((a) => a.disponibilidad === 'DISPONIBLE').length,
      altaCategoria: arbitros.filter((a) => ['REGIONAL', 'NACIONAL'].includes(a.categoria ?? '')).length,
      bajaCarga: arbitros.filter((a) => (a.totalPartidos ?? 0) <= 2).length,
    };
  });

  filters = {
    q: '',
    disponibilidad: '',
    categoria: '',
  };

  form: Partial<Arbitro> & { competenciasInput?: string } = this.emptyForm();

  ngOnInit(): void {
    void this.load();
  }

  get canManage(): boolean {
    return ['ADMIN', 'COORDINADOR_ARBITROS'].includes(this.auth.user()?.rol ?? '');
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.arbitros.set(await this.api.arbitros(this.filters));
    } catch {
      this.error.set('No se pudieron cargar los árbitros.');
    } finally {
      this.loading.set(false);
    }
  }

  edit(arbitro: Arbitro): void {
    this.editingId.set(arbitro.id);
    this.form = {
      nombre: arbitro.nombre ?? '',
      apellidos: arbitro.apellidos ?? '',
      email: arbitro.email ?? '',
      telefono: arbitro.telefono ?? '',
      dni: arbitro.dni ?? '',
      categoria: arbitro.categoria ?? 'LOCAL',
      licencia: arbitro.licencia ?? '',
      disponibilidad: arbitro.disponibilidad ?? 'DISPONIBLE',
      competenciasInput: (arbitro.competencias ?? []).join(', '),
      observaciones: arbitro.observaciones ?? '',
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
      competencias: this.parseCompetencias(this.form.competenciasInput),
    };
    delete payload.competenciasInput;

    try {
      const id = this.editingId();
      if (id) {
        await this.api.actualizarArbitro(id, payload);
      } else {
        await this.api.crearArbitro(payload);
      }
      this.cancelEdit();
      await this.load();
    } catch {
      this.error.set('No se pudo guardar el árbitro. Revisa correo, DNI y campos obligatorios.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggle(arbitro: Arbitro): Promise<void> {
    const next = arbitro.disponibilidad === 'DISPONIBLE' ? 'NO_DISPONIBLE' : 'DISPONIBLE';
    try {
      await this.api.cambiarDisponibilidadArbitro(arbitro.id, next);
      await this.load();
    } catch {
      this.error.set('No se pudo cambiar la disponibilidad.');
    }
  }

  async remove(arbitro: Arbitro): Promise<void> {
    if (!confirm(`Eliminar a ${this.fullName(arbitro)}?`)) return;

    try {
      await this.api.eliminarArbitro(arbitro.id);
      await this.load();
    } catch {
      this.error.set('No se pudo eliminar el árbitro.');
    }
  }

  fullName(arbitro: Arbitro): string {
    return `${arbitro.nombre ?? ''} ${arbitro.apellidos ?? ''}`.trim() || 'Árbitro';
  }

  private emptyForm(): Partial<Arbitro> & { competenciasInput?: string } {
    return {
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      dni: '',
      categoria: 'LOCAL',
      licencia: '',
      disponibilidad: 'DISPONIBLE',
      competenciasInput: 'FUTBOL',
      observaciones: '',
    };
  }

  private parseCompetencias(value?: string): string[] {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }
}
