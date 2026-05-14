import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { ArbitrosComponent } from './pages/arbitros/arbitros.component';
import { AsignacionesComponent } from './pages/asignaciones/asignaciones.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PartidosComponent } from './pages/partidos/partidos.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'partidos', component: PartidosComponent },
      { path: 'arbitros', component: ArbitrosComponent },
      { path: 'asignaciones', component: AsignacionesComponent },
      { path: 'calendario', component: CalendarioComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'perfil', component: PerfilComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
