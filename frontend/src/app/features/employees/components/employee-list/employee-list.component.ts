import {Component, inject, Input, OnInit} from '@angular/core';
import {Employee} from '../../../../core/services/employees/employee.types';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {EmployeeFormDialogComponent} from '../employee-form-dialog/employee-form-dialog.component';


@Component({
  selector: 'app-employee-list',
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  @Input() employees: Employee[] = [];

  readonly addEmployeeDialog = inject(MatDialog);

  ngOnInit () {
    console.log(this.employees);
  }


  openAddEmployeeDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.addEmployeeDialog.open(EmployeeFormDialogComponent, {
      width: '1000px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }


}
