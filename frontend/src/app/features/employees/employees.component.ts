import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {Employee} from '../../core/services/employees/employee.types';
import {EmployeeListComponent} from './components/employee-list/employee-list.component';
import {EmployeeInfoComponent} from './components/employee-info/employee-info.component';

@Component({
  selector: 'app-employees',
  imports: [
    EmployeeListComponent,
    EmployeeInfoComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {

  employees: Employee[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  //Wybrany pracownik
  employee!: Employee;

  constructor(
    private employeesService: EmployeesService,
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }


  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeesService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować pracowników';
        this.isLoading = false;
        console.error('Błąd ładowania pracowników:', error);
      }
    });
  }

  onEmployeeAdded(newEmployee: Employee) {
    this.employees.push(newEmployee);
  }

  onEmployeeDeleted(oldEmployee: Employee) {
    this.employees = this.employees.filter((employee) => employee.id !== oldEmployee.id);
  }

  onEmployeeSelected(selectedEmployee: Employee) {
    console.log("Selected", selectedEmployee);
    this.employee = selectedEmployee;
  }

}
