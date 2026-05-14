import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Arbitro,
  Asignacion,
  DashboardStats,
  LoginResponse,
  Match,
  PendingAssignment,
  User,
  UsuarioAdmin,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:8080/api';
  private readonly tokenKey = 'udc_token';

  login(username: string, password: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiBase}/auth/login`, { username, password }),
    );
  }

  me(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  dashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/dashboard/stats');
  }

  dashboardActividad(): Promise<unknown[]> {
    return this.get<unknown[]>('/dashboard/actividad');
  }

  partidos(params: Record<string, string | number | boolean | undefined> = {}): Promise<Match[]> {
    return this.get<Match[]>(`/partidos${this.query(params)}`);
  }

  proximosPartidos(): Promise<Match[]> {
    return this.get<Match[]>('/partidos/proximos');
  }

  partido(id: number | string): Promise<Match> {
    return this.get<Match>(`/partidos/${id}`);
  }

  crearPartido(data: Partial<Match>): Promise<Match> {
    return this.post<Match>('/partidos', data);
  }

  actualizarPartido(id: number | string, data: Partial<Match>): Promise<Match> {
    return this.patch<Match>(`/partidos/${id}`, data);
  }

  eliminarPartido(id: number | string): Promise<void> {
    return this.delete<void>(`/partidos/${id}`);
  }

  arbitros(params: Record<string, string | number | boolean | undefined> = {}): Promise<Arbitro[]> {
    return this.get<Arbitro[]>(`/arbitros${this.query(params)}`);
  }

  arbitrosDisponibles(fecha?: string): Promise<Arbitro[]> {
    return this.get<Arbitro[]>(`/arbitros/disponibles${this.query({ fecha })}`);
  }

  arbitro(id: number | string): Promise<Arbitro> {
    return this.get<Arbitro>(`/arbitros/${id}`);
  }

  crearArbitro(data: Partial<Arbitro>): Promise<Arbitro> {
    return this.post<Arbitro>('/arbitros', data);
  }

  actualizarArbitro(id: number | string, data: Partial<Arbitro>): Promise<Arbitro> {
    return this.put<Arbitro>(`/arbitros/${id}`, data);
  }

  eliminarArbitro(id: number | string): Promise<void> {
    return this.delete<void>(`/arbitros/${id}`);
  }

  cambiarDisponibilidadArbitro(id: number | string, estado: string): Promise<Arbitro> {
    return this.patch<Arbitro>(`/arbitros/${id}/disponibilidad`, { estado });
  }

  asignaciones(params: Record<string, string | number | boolean | undefined> = {}): Promise<Asignacion[]> {
    return this.get<Asignacion[]>(`/asignaciones${this.query(params)}`);
  }

  asignacionesPendientes(): Promise<PendingAssignment[]> {
    return this.get<PendingAssignment[]>('/asignaciones/pendientes');
  }

  crearAsignacion(data: {
    partidoId?: number | string;
    arbitroId?: number | string;
    rol?: string;
    observaciones?: string;
  }): Promise<Asignacion> {
    return this.post<Asignacion>('/asignaciones', data);
  }

  eliminarAsignacion(id: number | string): Promise<void> {
    return this.delete<void>(`/asignaciones/${id}`);
  }

  confirmarAsignacion(id: number | string): Promise<Asignacion> {
    return this.patch<Asignacion>(`/asignaciones/${id}/confirmar`, {});
  }

  rechazarAsignacion(id: number | string): Promise<Asignacion> {
    return this.patch<Asignacion>(`/asignaciones/${id}/rechazar`, {});
  }

  usuarios(): Promise<UsuarioAdmin[]> {
    return this.get<UsuarioAdmin[]>('/admin/usuarios');
  }

  crearUsuario(data: Record<string, unknown>): Promise<UsuarioAdmin> {
    return this.post<UsuarioAdmin>('/admin/usuarios', data);
  }

  actualizarUsuario(id: number | string, data: Record<string, unknown>): Promise<UsuarioAdmin> {
    return this.put<UsuarioAdmin>(`/admin/usuarios/${id}`, data);
  }

  private get<T>(endpoint: string): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(`${this.apiBase}${endpoint}`, {
        headers: this.authHeaders(),
      }),
    );
  }

  private post<T>(endpoint: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(`${this.apiBase}${endpoint}`, body, {
        headers: this.authHeaders(),
      }),
    );
  }

  private put<T>(endpoint: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.put<T>(`${this.apiBase}${endpoint}`, body, {
        headers: this.authHeaders(),
      }),
    );
  }

  private patch<T>(endpoint: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.patch<T>(`${this.apiBase}${endpoint}`, body, {
        headers: this.authHeaders(),
      }),
    );
  }

  private delete<T>(endpoint: string): Promise<T> {
    return firstValueFrom(
      this.http.delete<T>(`${this.apiBase}${endpoint}`, {
        headers: this.authHeaders(),
      }),
    );
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey) ?? ''}`,
    });
  }

  private query(params: Record<string, string | number | boolean | undefined>): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });

    const value = query.toString();
    return value ? `?${value}` : '';
  }
}
