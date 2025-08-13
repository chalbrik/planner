import {Component, computed, inject, OnInit, signal, ViewChild, ViewEncapsulation} from '@angular/core';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {Employee} from '../../core/services/employees/employee.types';
import {EmployeeInfoComponent} from './components/employee-info/employee-info.component';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatSidenav, MatSidenavContainer, MatSidenavContent, MatSidenavModule} from '@angular/material/sidenav';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {EmployeeFormDialogComponent} from './components/employee-form-dialog/employee-form-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {IconComponent} from '../../shared/components/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-employees',
  imports: [
    MatInput,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatSort,
    MatHeaderRow,
    MatRow,
    MatPaginator,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef,
    MatNoDataRow,
    MatFormField,
    MatLabel,
    MatSidenav,
    MatIcon,
    MatSidenavContainer,
    MatSidenavContent,
    EmployeeInfoComponent,
    IconComponent,
    MatIconModule,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EmployeesComponent implements OnInit {

  private readonly employeesService = inject(EmployeesService);
  private readonly dialog = inject(MatDialog);

  displayedColumns: string[] = ['identification_number', 'name', 'job', 'agreement_type', 'actions'];
  dataSource: MatTableDataSource<Employee>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = false;
  errorMessage: string | null = null;

  selectedEmployee = signal<Employee | null>(null);

  isSidenavOpen = computed(() => !!this.selectedEmployee());


  constructor() {
    this.dataSource = new MatTableDataSource<Employee>([]);
  }

  ngOnInit() {
    this.loadEmployees();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeesService.getEmployees().subscribe({
      next: (data) => {
        console.log("Pracownicy: ", data);
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować pracowników';
        this.isLoading = false;
        console.error('Błąd ładowania pracowników:', error);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

// Pomocnicza metoda do wyświetlania rodzaju umowy
  getAgreementTypeLabel(type: string): string {
    return type === 'permanent' ? 'Umowa o pracę' : 'Umowa na zlecenie';
  }

  onRowClick(employee: Employee): void {
    this.selectedEmployee.set(employee);
  }

  closeSidenav(): void {
    this.selectedEmployee.set(null);
  }

  openAddEmployeeDialog(): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '800px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeesService.addEmployee(result).subscribe({
          next: (newEmployee) => {
            // Dodaj do dataSource
            const currentData = this.dataSource.data;
            this.dataSource.data = [...currentData, newEmployee];
          },
          error: (error) => {
            console.error('Błąd podczas dodawania pracownika: ', error);
          }
        });
      }
    });
  }

  onDeleteEmployee(employee: Employee, event: Event): void {
    // Zatrzymaj propagację - żeby nie otworzyć sidenav
    event.stopPropagation();

    this.employeesService.deleteEmployee(employee.id).subscribe({
      next: () => {
        // Usuń z dataSource
        const currentData = this.dataSource.data;
        this.dataSource.data = currentData.filter(emp => emp.id !== employee.id);

        // Zamknij sidenav jeśli usuwany pracownik był wybrany
        if (this.selectedEmployee()?.id === employee.id) {
          this.closeSidenav();
        }
      },
      error: (error) => {
        console.error("Błąd podczas usuwania pracownika: ", error);
      }
    });
  }

}
