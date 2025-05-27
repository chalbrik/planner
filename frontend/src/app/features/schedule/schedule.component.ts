import {Component, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {ScheduleService} from '../../core/services/schedule.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MatCell, MatCellDef, MatColumnDef,
  MatFooterCell, MatFooterCellDef,
  MatFooterRow, MatFooterRowDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatButton} from '@angular/material/button';

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

@Component({
  selector: 'app-schedule',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatFooterCell,
    MatHeaderRow,
    MatRow,
    MatFooterRow,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatFooterCellDef,
    MatFooterRowDef,
    MatRowDef,
    MatHeaderRowDef,
    MatButton
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class ScheduleComponent implements OnInit {
  employees: any[] = [];
  workHours: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  currentMonth = signal<Date>(new Date());
  days = signal<Day[]>([]);

  // Zmienne tabeli
  displayedColumns: string[] = [];
  dataSource = ELEMENT_DATA;

  tables = [0];

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit() {
  this.loadEmployees();
  this.loadWorkHours();

    console.log("Pracownicy: ", this.employees);
    console.log("Godziny pracy: ", this.workHours);


    // Zmienne do tabeli
    this.displayedColumns.length = 10;
    this.displayedColumns.fill('filler');

    // The first two columns should be employees and name; the last two columns: hoursSum
    this.displayedColumns[0] = 'employees';
    this.displayedColumns[9] = 'hoursSum';

  }


  loadEmployees(){
    this.isLoading = true;
    this.scheduleService.getEmployees().subscribe({
        next: (data) => {
          this.employees = data;
          this.isLoading = false;
        },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować pracowników';
        this.isLoading = false;
        console.error('Błąd ładowania pracowników: ', error);
      },
    });
  }

  loadWorkHours(): void {
    this.isLoading = true;
    this.scheduleService.getWorkHours().subscribe({
      next: (data) => {
        this.workHours = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować harmonogramu';
        this.isLoading = false;
        console.error('Błąd ładowania harmonogramu:', error);
      }
    });
  }

  /** Whether the button toggle group contains the id as an active value. */
  isSticky(buttonToggleGroup: MatButtonToggleGroup, id: string) {
    return (buttonToggleGroup.value || []).indexOf(id) !== -1;
  }
}

export interface PeriodicElement {
  employees: string;
  hoursSum: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
  {employees: "Jan Kowalski", hoursSum: 98},
];
