import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {DashboardLayoutComponent} from './layout/dashboard-layout/dashboard-layout.component';
import {EmployeesRoutes} from './features/employees/employees.routes';
import {
  EmployeeFormDialogComponent
} from './features/employees/components/employee-form-dialog/employee-form-dialog.component';

//trzeba bedzie dodac pozniej te linike do poszczegolnych patch zeby logowanie dzialalo
//canActivate: [AuthGuard],

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
        canActivate: [AuthGuard],
      },
      {
        path: 'schedule',
        loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.routes').then(m => m.EmployeesRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'add-employee',
        component: EmployeeFormDialogComponent,
        canActivate: [AuthGuard],
      },
      {
        path: '',
        redirectTo: '/schedule',
        pathMatch: 'full',
      }
    ]
  },
  // { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];
