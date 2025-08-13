import {Component, inject, OnInit, input, output} from '@angular/core';
import {Employee} from '../../../../core/services/employees/employee.types';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {EmployeeFormComponent} from '../employee-form-dialog/employee-form.component';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatFormField, MatInput, MatSuffix} from '@angular/material/input';


@Component({
  selector: 'app-employee-list',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatFormField,
    MatInput,
    MatSuffix,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  readonly employees = input<Employee[]>([]);
  readonly employeeAdded = output<Employee>();
  readonly employeeDeleted = output<Employee>();
  readonly employeeSelected = output<Employee>();

  readonly addEmployeeDialog = inject(MatDialog);

  constructor(private employeesService: EmployeesService) {
  }

  ngOnInit () {
    console.log(this.employees());
  }


  openAddEmployeeDialog(): void {
    const dialogRef = this.addEmployeeDialog.open(EmployeeFormComponent, {
      width: '800px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeesService.addEmployee(result).subscribe({
          next: (newEmployee) => {
            this.employeeAdded.emit(newEmployee);
          },
          error: (error) => {
            console.error('Błąd podczas dodawania pracownika: ', error);
          }
        });
      }
    })
  }

  onDeleteEmployee(employee: Employee) {
    this.employeesService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.employeeDeleted.emit(employee);
      },
      error: (error) => {
        console.error("Błąd podczas usuwania pracownika: ", error);
      }
    })

  }

  onEmployeeSelect(selectedEmployee: Employee){
    this.employeeSelected.emit(selectedEmployee);
  }


  protected readonly onclick = onclick;
}
