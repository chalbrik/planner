import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {DashboardLayoutComponent} from './layout/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      }
    ]
  },
  // { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];
