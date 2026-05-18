import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardStats, Match, PendingAssignment, QuickActionVm, StatCardVm } from '../../core/models';
import { CollapsiblePanelComponent } from '../../shared/components/collapsible-panel/collapsible-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatchCardComponent } from '../../shared/components/match-card/match-card.component';
import { QuickActionCardComponent } from '../../shared/components/quick-action-card/quick-action-card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CollapsiblePanelComponent,
    EmptyStateComponent,
    MatchCardComponent,
    QuickActionCardComponent,
    RouterLink,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly matches = signal<Match[]>([]);
  readonly pendingAssignments = signal<PendingAssignment[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly featuredMatch = computed(() => this.matches()[0] ?? null);
  readonly visibleMatches = computed(() => this.matches().slice(this.featuredMatch() ? 1 : 0, 6));
  readonly visiblePending = computed(() => this.pendingAssignments().slice(0, 4));

  readonly statCards = computed<StatCardVm[]>(() => {
    const stats = this.stats();
    const partidosSemana = stats?.partidosSemana ?? 0;
    const arbitrosDisponibles = stats?.arbitrosDisponibles ?? 0;
    const totalArbitros = stats?.totalArbitros ?? 0;
    const pendientes = stats?.asignacionesPendientes ?? 0;
    const conflictos = stats?.conflictos ?? 0;

    return [
      {
        title: 'Partidos esta semana',
        value: partidosSemana,
        subtitle: 'Encuentros programados en los próximos días',
        trend: partidosSemana > 0 ? 'Activo' : 'Sin partidos',
        icon: 'bi-trophy',
        tone: 'blue',
      },
      {
        title: 'Árbitros disponibles',
        value: totalArbitros ? `${arbitrosDisponibles}/${totalArbitros}` : arbitrosDisponibles,
        subtitle: 'Colegiados listos para cubrir partidos',
        trend: arbitrosDisponibles > 0 ? 'Operativo' : 'Revisar',
        icon: 'bi-shield-check',
        tone: arbitrosDisponibles > 0 ? 'green' : 'yellow',
      },
      {
        title: 'Asignaciones pendientes',
        value: pendientes,
        subtitle: 'Necesitan confirmación o revisión',
        trend: pendientes > 0 ? 'Pendiente' : 'Al día',
        icon: 'bi-clipboard-check',
        tone: pendientes > 0 ? 'yellow' : 'green',
      },
      {
        title: 'Conflictos activos',
        value: conflictos,
        subtitle: 'Solapes o incidencias detectadas',
        trend: conflictos > 0 ? 'Atención' : 'Sin incidencias',
        icon: 'bi-exclamation-triangle',
        tone: conflictos > 0 ? 'red' : 'green',
      },
    ];
  });

  readonly quickActions = computed<QuickActionVm[]>(() => {
    const role = this.auth.user()?.rol;
    const actions: QuickActionVm[] = [
      {
        title: 'Ver calendario',
        subtitle: 'Agenda semanal y mensual',
        icon: 'bi-calendar3',
        href: '/calendario',
        tone: 'yellow',
      },
    ];

    if (['ADMIN', 'COORDINADOR_ARBITROS', 'ORGANIZADOR', 'ARBITRO'].includes(role ?? '')) {
      actions.push({
        title: 'Mis asignaciones',
        subtitle: 'Confirmar o revisar partidos',
        icon: 'bi-calendar2-check',
        href: '/asignaciones',
        tone: 'green',
      });
    }

    if (['ADMIN', 'ORGANIZADOR'].includes(role ?? '')) {
      actions.unshift({
        title: 'Nuevo partido',
        subtitle: 'Crear encuentro deportivo',
        icon: 'bi-plus-lg',
        href: '/partidos',
        tone: 'blue',
      });
    }

    if (['ADMIN', 'COORDINADOR_ARBITROS'].includes(role ?? '')) {
      actions.push({
        title: 'Gestionar árbitros',
        subtitle: 'Disponibilidad y categorías',
        icon: 'bi-people',
        href: '/arbitros',
        tone: 'neutral',
      });
    }

    return actions;
  });

  readonly activity = [
    {
      icon: 'bi-check-circle',
      tone: 'green',
      title: 'Sistema conectado',
      detail: 'El dashboard está leyendo datos del backend en tiempo real.',
    },
    {
      icon: 'bi-calendar2-week',
      tone: 'blue',
      title: 'Calendario sincronizado',
      detail: 'Los próximos partidos se muestran desde la API actual.',
    },
    {
      icon: 'bi-stars',
      tone: 'yellow',
      title: 'Nueva experiencia Angular',
      detail: 'El frontend ya usa componentes reutilizables para seguir creciendo.',
    },
  ];

  readonly recentResults = [
    {
      home: 'UDC Norte',
      away: 'UDC Sur',
      score: '2 - 1',
      meta: 'Fútbol · Liga Insular',
    },
    {
      home: 'CB Laguna',
      away: 'Gran Canaria B',
      score: '68 - 64',
      meta: 'Baloncesto · Senior femenino',
    },
    {
      home: 'Arona Voley',
      away: 'Telde VC',
      score: '3 - 2',
      meta: 'Voleibol · Juvenil',
    },
  ];

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    const [statsResult, matchesResult, pendingResult] = await Promise.allSettled([
      this.api.dashboardStats(),
      this.api.proximosPartidos(),
      this.api.asignacionesPendientes(),
    ]);

    if (statsResult.status === 'fulfilled') {
      this.stats.set(statsResult.value);
    }

    if (matchesResult.status === 'fulfilled') {
      this.matches.set(matchesResult.value);
    }

    if (pendingResult.status === 'fulfilled') {
      this.pendingAssignments.set(pendingResult.value);
    }

    if ([statsResult, matchesResult, pendingResult].some((result) => result.status === 'rejected')) {
      this.error.set('Algunos datos no se han podido cargar. Revisa que el backend esté arrancado.');
    }

    this.loading.set(false);
  }

  greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  todayLabel(): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  matchTitle(match: Match): string {
    const local = match.equipoLocal ?? match.equipoLocalNombre ?? 'Equipo local';
    const visitante = match.equipoVisitante ?? match.equipoVisitanteNombre ?? 'Equipo visitante';
    return `${local} vs ${visitante}`;
  }

  matchCategory(match: Match): string {
    return match.competicion ?? match.categoria ?? 'Competición general';
  }

  matchDate(match: Match): string {
    const date = match.fecha ?? match.fechaInicio;

    if (!date) {
      return 'Fecha pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  refereeCoverage(match: Match): string {
    const assigned = match.arbitrosAsignados ?? 0;
    const required = match.arbitrosRequeridos ?? match.plazasArbitralesSolicitadas ?? 0;
    return required ? `${assigned}/${required}` : `${assigned}`;
  }

  coveragePercent(match: Match): number {
    const assigned = match.arbitrosAsignados ?? 0;
    const required = match.arbitrosRequeridos ?? match.plazasArbitralesSolicitadas ?? 1;
    return Math.max(0, Math.min(100, Math.round((assigned / required) * 100)));
  }

  matchPlace(match: Match): string {
    return match.lugar || 'Lugar pendiente';
  }

  teamLogo(index: number): string {
    return `/assets/images/logo-equipo-${index}.png`;
  }

  pendingTitle(item: PendingAssignment): string {
    const local = item.partido?.equipoLocal ?? 'Equipo local';
    const visitante = item.partido?.equipoVisitante ?? 'Equipo visitante';
    return `${local} vs ${visitante}`;
  }

  pendingDate(item: PendingAssignment): string {
    if (!item.partido?.fecha) {
      return 'Fecha pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(item.partido.fecha));
  }
}
