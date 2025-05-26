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

    // The first two columns should be employees and name; the last two columns: weight, symbol
    this.displayedColumns[0] = 'employees';
    this.displayedColumns[1] = 'name';
    this.displayedColumns[6] = 'weight';
    this.displayedColumns[9] = 'symbol';

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
  name: string;
  employees: string;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {employees: "Jan Kowalski", name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {employees: "Jan Kowalski", name: 'Helium', weight: 4.0026, symbol: 'He'},
  {employees: "Jan Kowalski", name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {employees: "Jan Kowalski", name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {employees: "Jan Kowalski", name: 'Boron', weight: 10.811, symbol: 'B'},
  {employees: "Jan Kowalski", name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {employees: "Jan Kowalski", name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {employees: "Jan Kowalski", name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {employees: "Jan Kowalski", name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {employees: "Jan Kowalski", name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];
