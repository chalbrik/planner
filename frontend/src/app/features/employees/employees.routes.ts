import {Routes} from '@angular/router';
import {EmployeesComponent} from './employees.component';
import {EmployeeFormDialogComponent} from './components/employee-form-dialog/employee-form-dialog.component';


export const EmployeesRoutes: Routes = [
  {
    path: '',
    component: EmployeesComponent,
  }
]
