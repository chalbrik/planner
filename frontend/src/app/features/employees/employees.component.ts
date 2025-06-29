import {Component, computed, OnInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {Employee} from '../../core/services/employees/employee.types';
import {EmployeeListComponent} from './components/employee-list/employee-list.component';
import {EmployeeInfoComponent} from './components/employee-info/employee-info.component';
import {NgComponentOutlet} from '@angular/common';
import {BlanckEmployeeInfoComponent} from './components/blanck-employee-info/blanck-employee-info.component';

@Component({
  selector: 'app-employees',
  imports: [
    EmployeeListComponent,
    NgComponentOutlet
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {

  employees: Employee[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  //Wybrany pracownik
  selectedEmployee = signal<Employee | null>(null);



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
    this.selectedEmployee.set(selectedEmployee);
  }

  //Metoda do warunkowego wyswietlania komponentow
  currentComponent = computed(() => {
    return this.selectedEmployee() ?  EmployeeInfoComponent : BlanckEmployeeInfoComponent;
  })

  componentInputs = computed(() => {
    return this.selectedEmployee() ? { employee: this.selectedEmployee() } : {};
  })

}
