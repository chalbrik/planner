import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {Employee} from '../../core/services/employees/employee.types';
import {EmployeeListComponent} from './components/employee-list/employee-list.component';

@Component({
  selector: 'app-employees',
  imports: [
    EmployeeListComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {

  employees: Employee[] = [];
  isLoading = false;
  errorMessage: string | null = null;

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

}
