import {Routes} from '@angular/router';
import {EmployeesComponent} from './employees.component';
import {EmployeeFormComponent} from './components/employee-form-dialog/employee-form.component';


export const EmployeesRoutes: Routes = [
  {
    path: '',
    component: EmployeesComponent,
  }
]
