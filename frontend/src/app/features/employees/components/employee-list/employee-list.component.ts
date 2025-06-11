import {Component, Input, OnInit} from '@angular/core';
import {Employee} from '../../../../core/services/employees/employee.types';


@Component({
  selector: 'app-employee-list',
  imports: [],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  @Input() employees: Employee[] = [];

  ngOnInit () {
    console.log(this.employees);
  }



}
