import {Component, computed, effect, inject, input, signal} from '@angular/core';
import {Employee} from '../../../../core/services/employees/employee.types';
import {MatDivider} from '@angular/material/divider';
import {InfoDisplayComponent} from '../../../../shared/components/info-display/info-display.component';
import {
  MatAccordion,
  MatExpansionPanel, MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import {MatButton} from '@angular/material/button';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {VacationLeavesService} from '../../../../core/services/vacation_leaves/vacation-leaves.service';
import {VacationLeaves} from '../../../../core/services/vacation_leaves/vacation-leaves.types';

@Component({
  selector: 'app-employee-info',
  imports: [
    MatDivider,
    InfoDisplayComponent,
    MatAccordion,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatButton,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatColumnDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatRowDef
  ],
  templateUrl: './employee-info.component.html',
  styleUrl: './employee-info.component.scss'
})
export class EmployeeInfoComponent {
  readonly employee = input.required<Employee>();

  private readonly vacationLeavesService = inject(VacationLeavesService);

  employeeVacationLeaves = signal<VacationLeaves>({
    id: '',
    employee: '',
    employee_name: '',
    current_vacation_days: 0,
    used_vacation_days: 0,
    remaining_vacation_days: 0,
    current_vacation_hours: 0,
    used_vacation_hours: 0,
    remaining_vacation_hours: 0,
  });

  displayedColumns: string[] = ['type', 'remaining', 'used', 'total'];

  vacationTableData = computed(() => {
    const vacation = this.employeeVacationLeaves();

    return [
      {
        type: 'Godziny',
        remaining: vacation.remaining_vacation_hours,
        used: vacation.used_vacation_hours,
        current: vacation.current_vacation_hours
      },
      {
        type: 'Dni',
        remaining: vacation.remaining_vacation_days,
        used: vacation.used_vacation_days,
        current: vacation.current_vacation_days
      }
    ];
  });


  constructor() {
    effect(() => {
      const employee = this.employee();
      if (employee?.id) {
        this.loadEmployeeVacationLeaves(employee.id);
      }
    });
  }

  ngOnInit() {
    console.log('Employee: ',  this.employee());
  }

  private loadEmployeeVacationLeaves(employeeId: string): void {
    this.vacationLeavesService.getVacationLeaves({ employee_id: employeeId }).subscribe({
      next: (vacationLeaves) => {
        console.log("Urlopy: ", vacationLeaves)
        this.employeeVacationLeaves.set(vacationLeaves);
      },
      error: (error) => {
        console.error('Błąd ładowania urlopów:', error);
      }
    });
  }
}

