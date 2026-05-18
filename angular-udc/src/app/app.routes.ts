import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { ArbitrosComponent } from './pages/arbitros/arbitros.component';
import { AsignacionesComponent } from './pages/asignaciones/asignaciones.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PartidosComponent } from './pages/partidos/partidos.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { authGuard, roleGuard } from './core/route-guards';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'partidos', component: PartidosComponent, canActivate: [authGuard] },
      {
        path: 'arbitros',
        component: ArbitrosComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COORDINADOR_ARBITROS'] },
      },
      {
        path: 'asignaciones',
        component: AsignacionesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COORDINADOR_ARBITROS', 'ORGANIZADOR', 'ARBITRO'] },
      },
      { path: 'calendario', component: CalendarioComponent, canActivate: [authGuard] },
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
