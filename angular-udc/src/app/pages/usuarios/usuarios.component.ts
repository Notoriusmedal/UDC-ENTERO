import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UsuarioAdmin } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, CollapsiblePanelComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editingId = signal<number | null>(null);

  filter = '';
  readonly metrics = computed(() => {
    const usuarios = this.usuarios();
    return {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.enabled).length,
      pendientes: usuarios.filter((u) => !u.enabled && ['ORGANIZADOR', 'ARBITRO'].includes(u.rol ?? '')).length,
      admins: usuarios.filter((u) => u.rol === 'ADMIN').length,
      arbitros: usuarios.filter((u) => u.rol === 'ARBITRO').length,
    };
  });

  form = this.emptyForm();

  ngOnInit(): void {
    if (this.canManage) {
      void this.load();
    }
  }

  get canManage(): boolean {
    return this.auth.user()?.rol === 'ADMIN';
  }

  get filtered(): UsuarioAdmin[] {
    const q = this.filter.trim().toLowerCase();
    if (!q) return this.usuarios();
    return this.usuarios().filter((u) =>
      [u.username, u.nombre, u.apellidos, u.correo, u.rol].some((value) => (value ?? '').toLowerCase().includes(q)),
    );
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.usuarios.set(await this.api.usuarios());
    } catch {
      this.error.set('No se pudieron cargar los usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  edit(usuario: UsuarioAdmin): void {
    this.editingId.set(usuario.id);
    this.form = {
      username: usuario.username ?? '',
      passwordClaro: '',
      nombre: usuario.nombre ?? '',
      apellidos: usuario.apellidos ?? '',
      correo: usuario.correo ?? '',
      documentoIdentidad: '',
      telefono: '',
      rol: usuario.rol ?? 'ARBITRO',
      enabled: usuario.enabled ?? true,
      convocableParaSeleccionArbitral: usuario.convocableParaSeleccionArbitral ?? false,
    };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      const id = this.editingId();
      if (id) {
        await this.api.actualizarUsuario(id, {
          passwordClaroOpcional: this.form.passwordClaro || null,
          nombre: this.form.nombre,
          apellidos: this.form.apellidos,
          correo: this.form.correo,
          telefono: this.form.telefono || null,
          rol: this.form.rol,
          enabled: this.form.enabled,
          convocableParaSeleccionArbitral: this.form.convocableParaSeleccionArbitral,
        });
      } else {
        await this.api.crearUsuario({
          username: this.form.username,
          passwordClaro: this.form.passwordClaro,
          nombre: this.form.nombre,
          apellidos: this.form.apellidos,
          correo: this.form.correo,
          documentoIdentidad: this.form.documentoIdentidad,
          telefono: this.form.telefono,
          rol: this.form.rol,
          convocableParaSeleccionArbitral: this.form.convocableParaSeleccionArbitral,
        });
      }
      this.cancelEdit();
      await this.load();
    } catch {
      this.error.set('No se pudo guardar el usuario. Revisa campos obligatorios y permisos.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggle(usuario: UsuarioAdmin): Promise<void> {
    try {
      await this.api.actualizarUsuario(usuario.id, {
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
        enabled: !usuario.enabled,
        convocableParaSeleccionArbitral: usuario.convocableParaSeleccionArbitral,
      });
      await this.load();
    } catch {
      this.error.set('No se pudo cambiar el estado del usuario.');
    }
  }

  fullName(usuario: UsuarioAdmin): string {
    return `${usuario.nombre ?? ''} ${usuario.apellidos ?? ''}`.trim() || usuario.username || 'Usuario';
  }

  accountStatus(usuario: UsuarioAdmin): string {
    if (usuario.enabled) return 'sin_conflictos';
    return ['ORGANIZADOR', 'ARBITRO'].includes(usuario.rol ?? '') ? 'pendiente' : 'cancelado';
  }

  accountStatusLabel(usuario: UsuarioAdmin): string {
    if (usuario.enabled) return 'Activo';
    return ['ORGANIZADOR', 'ARBITRO'].includes(usuario.rol ?? '') ? 'Pendiente admin' : 'Inactivo';
  }

  private emptyForm() {
    return {
      username: '',
      passwordClaro: '',
      nombre: '',
      apellidos: '',
      correo: '',
      documentoIdentidad: '',
      telefono: '',
      rol: 'ARBITRO',
      enabled: true,
      convocableParaSeleccionArbitral: false,
    };
  }
}
