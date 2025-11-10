import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import {DashboardLayoutComponent} from './layout/dashboard-layout/dashboard-layout.component';
import {LandingLayoutComponent} from './layout/landing-layout/landing-layout.component';


export const routes: Routes = [
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      }
    ]
  },
  {
    path: 'app',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'schedule',
        loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
      },
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.routes').then(m => m.EmployeesRoutes),
      },
      {
        path: 'locations',
        loadChildren: () => import('./features/locations/locations.routes').then(m => m.LocationsRoutes),
      },
      {
        path: 'disposal',
        loadChildren: () => import('./features/disposal/disposal.routes').then(m => m.DisposalRoutes),
      },
      {
        path: '',
        redirectTo: 'schedule',
        pathMatch: 'full',
      }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
