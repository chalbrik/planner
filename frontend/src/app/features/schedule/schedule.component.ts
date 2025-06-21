import {Component, OnInit, signal, computed, ViewEncapsulation} from '@angular/core';
import {ScheduleService} from '../../core/services/schedule/schedule.service';
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
import {EmployeesService} from '../../core/services/employees/employees.service';
import {EditScheduleComponentComponent} from './components/edit-schedule-component/edit-schedule-component.component';

interface Day {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

interface EmployeeRow {
  id: number;
  name: string;
  workHours: { [key: string]: string }; // klucz to data w formacie YYYY-MM-DD, wartość to godziny pracy
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
    MatButtonToggleGroup,
    MatButtonToggle,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatFooterCellDef,
    MatRowDef,
    MatHeaderRowDef,
    MatButton,
    EditScheduleComponentComponent
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

  // Sygnały dla zarządzania datami
  currentMonth = signal<Date>(new Date());

  // Obliczony sygnał dla dni miesiąca
  monthDays = computed(() => {
    const currentDate = this.currentMonth();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Pierwszy dzień miesiąca
    const firstDay = new Date(year, month, 1);
    // Ostatni dzień miesiąca
    const lastDay = new Date(year, month + 1, 0);

    const days: Day[] = [];
    const today = new Date();

    // Generuj wszystkie dni miesiąca
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = niedziela, 6 = sobota

      days.push({
        date: date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    return days;
  });

  // Obliczony sygnał dla kolumn tabeli
  displayedColumns = computed(() => {
    const days = this.monthDays();
    const dayColumns = days.map(day => `day-${day.dayNumber}`);
    return ['employees', ...dayColumns, 'hoursSum'];
  });

  // Przygotowane dane dla tabeli
  dataSource: EmployeeRow[] = [];

  tables = [0];

  constructor(
    private scheduleService: ScheduleService,
    private employeesService: EmployeesService,
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadWorkHours();

  }

  loadEmployees() {
    this.isLoading = true;
    this.employeesService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.prepareTableData();
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
    const currentDate = this.currentMonth();
    const filters = {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    };

    this.scheduleService.getWorkHours(filters).subscribe({
      next: (data) => {
        this.workHours = data;
        this.prepareTableData();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować harmonogramu';
        this.isLoading = false;
        console.error('Błąd ładowania harmonogramu:', error);
      }
    });
  }

  prepareTableData() {
    if (this.employees.length === 0) return;

    this.dataSource = this.employees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};

      console.log('Dane z API - workHours:', this.workHours);

      // Znajdź godziny pracy dla tego pracownika
      const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
      });

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        workHours: workHoursMap
      };
    });
  }

  // Metoda do pobierania godzin pracy dla konkretnego dnia i pracownika
  getWorkHoursForDay(employee: EmployeeRow, dayNumber: number): string {
    const currentDate = this.currentMonth();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    return employee.workHours[dateString] || '';
  }

  // Metoda do obliczania sumy godzin dla pracownika (uproszczona)
  getTotalHoursForEmployee(employee: EmployeeRow): number {
    const hours = Object.values(employee.workHours);
    // To jest uproszczona logika - możesz ją rozbudować
    return hours.length * 8; // Przykład: każdy dzień pracy = 8 godzin
  }

  // Metoda do zmiany miesiąca
  changeMonth(direction: number) {
    const current = this.currentMonth();
    const newDate = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    this.currentMonth.set(newDate);
    this.loadWorkHours(); // Przeładuj dane dla nowego miesiąca
  }

  getMonthName(): string {
    const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const currentDate = this.currentMonth();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  /** Whether the button toggle group contains the id as an active value. */
  isSticky(buttonToggleGroup: MatButtonToggleGroup, id: string) {
    return (buttonToggleGroup.value || []).indexOf(id) !== -1;
  }

  // Metoda pomocnicza do sprawdzania czy dzień jest weekendem
  isDayWeekend(dayNumber: number): boolean {
    const currentDate = this.currentMonth();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // Metoda pomocnicza do sprawdzania czy dzień jest dzisiaj
  isDayToday(dayNumber: number): boolean {
    const currentDate = this.currentMonth();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  onClickedScheduleBox(flag: string){
    if(flag === 'employee'){
      return 
    }
    if(flag === 'workHours'){

    }
}

}
