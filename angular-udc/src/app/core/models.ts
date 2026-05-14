export type User = {
  id?: number;
  username?: string;
  rol?: string;
  nombre?: string;
  apellidos?: string;
  correo?: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType?: string;
  expiresInMinutes?: number;
  username?: string;
  rol?: string;
};

export type DashboardStats = {
  partidosSemana?: number;
  partidosSemanaAnterior?: number;
  arbitrosDisponibles?: number;
  totalArbitros?: number;
  asignacionesPendientes?: number;
  conflictos?: number;
};

export type Match = {
  id: number;
  nombre?: string;
  equipoLocal?: string;
  equipoVisitante?: string;
  equipoLocalNombre?: string;
  equipoVisitanteNombre?: string;
  lugar?: string;
  fecha?: string;
  fechaInicio?: string;
  deporte?: string;
  competicion?: string;
  categoria?: string;
  estado?: string;
  arbitrosAsignados?: number;
  arbitrosRequeridos?: number;
  plazasArbitralesSolicitadas?: number;
  observaciones?: string;
};

export type Arbitro = {
  id: number;
  nombre?: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  categoria?: string;
  licencia?: string;
  disponibilidad?: string;
  observaciones?: string;
  competencias?: string[];
  totalPartidos?: number;
};

export type UsuarioMini = {
  id?: number;
  nombre?: string;
  apellidos?: string;
};

export type PartidoMini = {
  id?: number;
  equipoLocal?: string;
  equipoVisitante?: string;
  competicion?: string;
  fecha?: string;
  lugar?: string;
  deporte?: string;
};

export type Asignacion = {
  id: number;
  partido?: PartidoMini;
  arbitro?: UsuarioMini;
  asignadoPor?: UsuarioMini;
  rol?: string;
  estado?: string;
  observaciones?: string;
  partidoId?: number;
  arbitroId?: number;
};

export type PendingAssignment = {
  partido?: PartidoMini;
};

export type UsuarioAdmin = {
  id: number;
  username?: string;
  nombre?: string;
  apellidos?: string;
  correo?: string;
  rol?: string;
  enabled?: boolean;
  convocableParaSeleccionArbitral?: boolean;
};

export type StatCardVm = {
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
  icon: string;
  tone: 'blue' | 'green' | 'yellow' | 'red' | 'neutral';
};

export type QuickActionVm = {
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  tone: 'blue' | 'green' | 'yellow' | 'red' | 'neutral';
};
