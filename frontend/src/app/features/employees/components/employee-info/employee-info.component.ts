import {Component, input} from '@angular/core';
import {Employee} from '../../../../core/services/employees/employee.types';
import {IconComponent} from '../../../../shared/components/icon';

@Component({
  selector: 'app-employee-info',
  imports: [
    IconComponent
  ],
  templateUrl: './employee-info.component.html',
  styleUrl: './employee-info.component.scss'
})
export class EmployeeInfoComponent {
  readonly employee = input.required<Employee>();

  ngOnInit() {
    console.log('Employee: ',  this.employee());
  }

}
