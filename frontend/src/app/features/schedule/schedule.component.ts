import {Component, OnInit, signal, computed, ViewEncapsulation, inject} from '@angular/core';
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
import {MatButton, MatIconButton} from '@angular/material/button';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {EditScheduleComponentComponent} from './components/edit-schedule-component/edit-schedule-component.component';
import {
  BlancEditScheduleComponentComponent
} from './components/blanc-edit-schedule-component/blanc-edit-schedule-component.component';
import {IconComponent} from '../../shared/components/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotificationPopUpComponent } from './components/notification-pop-up/notification-pop-up.component'; // sprawdź ścieżkę!

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
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatFooterCellDef,
    MatRowDef,
    MatHeaderRowDef,
    MatButton,
    EditScheduleComponentComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    IconComponent,
    MatIconButton
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class ScheduleComponent implements OnInit {

  private readonly dialog = inject(MatDialog);

  employees: any[] = [];
  workHours: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Sygnały dla zarządzania datami
  currentMonthDate = signal<Date>(new Date());

  // Obliczony sygnał dla dni miesiąca
  monthDays = computed(() => {
    const currentDate = this.currentMonthDate();
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

  selectedCell = signal<{
    employee: any;
    workHours: any;
    date: string
  } | undefined>(undefined);

  conflictingCells = signal<Set<string>>(new Set());
  badWeeks = signal<Map<string, Set<number>>>(new Map());
  exceedingWorkHours = signal<Set<string>>(new Set());

  constructor(
    private scheduleService: ScheduleService,
    private employeesService: EmployeesService,
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadWorkHours();

    this.scheduleService.scheduleUpdated$.subscribe((updatedData) => {
      this.loadWorkHours();
      this.selectedCell.set(undefined);

      this.checkRestTimeConflicts();
      // this.checkWorkHoursExceed12h(updatedData.hours, updatedData.employee, updatedData.date);

      this.validateAndShowErrors(updatedData);
    });

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
    const currentDate = this.currentMonthDate();
    const filters = {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    };

    this.scheduleService.getWorkHours(filters).subscribe({
      next: (data) => {
        // console.log("workHours", data);
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

    console.log('prepareTableData - employees:', this.employees.length); // DODAJ TO
    console.log('prepareTableData - workHours:', this.workHours.length); // DODAJ TO

    this.dataSource = this.employees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
      const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      console.log(`Pracownik ${employee.first_name}: ${employeeWorkHours.length} godzin pracy`); // DODAJ TO

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
        this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
      });

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        workHours: workHoursMap
      };
    });

    this.checkRestTimeConflicts();
    this.check35HourRestInAllWeeks();
  }

  // Metoda do pobierania godzin pracy dla konkretnego dnia i pracownika
  getWorkHoursForDay(employee: EmployeeRow, dayNumber: number): string {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    return employee.workHours[dateString] || '';
  }

  // Metoda do obliczania sumy godzin dla pracownika (uproszczona)
  // getTotalHoursForEmployee(employee: EmployeeRow): number {
  //   const hours = Object.values(employee.workHours);
  //   // To jest uproszczona logika - możesz ją rozbudować
  //   return hours.length * 8; // Przykład: każdy dzień pracy = 8 godzin
  // }

  getTotalHoursForEmployee(employee: EmployeeRow): number {
    let totalHours = 0;

    // Iteruj przez wszystkie godziny pracy tego pracownika
    Object.values(employee.workHours).forEach(hoursString => {
      if (hoursString) {
        // Parsuj format "8:00-16:00"
        const match = hoursString.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);

        if (match) {
          const [, startHour, startMin, endHour, endMin] = match;

          // Konwertuj na minuty
          const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
          const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);

          // Oblicz różnicę w godzinach
          const hoursWorked = (endMinutes - startMinutes) / 60;
          totalHours += hoursWorked;
        }
      }
    });

    return Math.round(totalHours * 100) / 100; // zaokrągl do 2 miejsc po przecinku
  }

  // Metoda do zmiany miesiąca
  changeMonth(direction: number) {
    const current = this.currentMonthDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    this.currentMonthDate.set(newDate);
    this.loadWorkHours(); // Przeładuj dane dla nowego miesiąca
  }

  getMonthName(): string {
    const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const currentDate = this.currentMonthDate();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  /** Whether the button toggle group contains the id as an active value. */
  isSticky(buttonToggleGroup: MatButtonToggleGroup, id: string) {
    return (buttonToggleGroup.value || []).indexOf(id) !== -1;
  }

  // Metoda pomocnicza do sprawdzania czy dzień jest weekendem
  isDayWeekend(dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // Metoda pomocnicza do sprawdzania czy dzień jest dzisiaj
  isDayToday(dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  onCellClick(employee: EmployeeRow, dayNumber: number) {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    console.log("DateString: ", dateString);

    const workHoursObject = this.workHours.find(wh =>
      wh.employee === employee.id && wh.date === dateString
    );
    this.selectedCell.set({
      employee: employee,
      workHours: workHoursObject || null,
      date: dateString
    });
  }

  onCancelSelection() {
    this.selectedCell.set(undefined);
  }

  //Metoda warunkowa do wyświetlania komponentów
  currentComponent = computed(() => {
    return this.selectedCell() ? EditScheduleComponentComponent : BlancEditScheduleComponentComponent;
  })

  componentInputs = computed(() => {
    return this.selectedCell() ? { selectedCell: this.selectedCell() } : {};
  })

  //Pobieranie godzin z dnia poprzedniego oraz nastepnego
  private getAdjacentDaysHours(employeeId: number, currentDate: string): { previousDay: string | null, nextDay: string | null } {
    const currentDateObj = new Date(currentDate);

    // Poprzedni dzień
    const previousDateObj = new Date(currentDateObj);
    previousDateObj.setDate(previousDateObj.getDate() - 1);
    const previousDateString = previousDateObj.toISOString().split('T')[0];

    // Następny dzień
    const nextDateObj = new Date(currentDateObj);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateString = nextDateObj.toISOString().split('T')[0];

    // Pobierz godziny z workHours
    const previousDayHours = this.workHours.find(wh =>
      wh.employee === employeeId && wh.date === previousDateString
    )?.hours || null;

    const nextDayHours = this.workHours.find(wh =>
      wh.employee === employeeId && wh.date === nextDateString
    )?.hours || null;

    return {
      previousDay: previousDayHours,
      nextDay: nextDayHours
    };
  }



  private parseWorkHours(hoursString: string): { startTime: number, endTime: number } | null {
    const match = hoursString.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);

    if (!match) return null;

    const [, startHour, startMin, endHour, endMin] = match;

    return {
      startTime: parseInt(startHour) * 60 + parseInt(startMin), // minuty od północy
      endTime: parseInt(endHour) * 60 + parseInt(endMin)
    };
  }

  private checkRestTimeConflicts(): void {
    const conflicts = this.scheduleService.validateRestTimeConflicts(
      this.employees,
      this.workHours,
      (employeeId: number, date: string) => this.getAdjacentDaysHours(employeeId, date)
    );

    this.conflictingCells.set(conflicts);
  }

  // Metoda do sprawdzania czy komórka jest konfliktowa
  isCellConflicting(employee: EmployeeRow, dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    return this.conflictingCells().has(cellKey);
  }

  // Metoda pomocnicza - oblicz numer tygodnia dla dnia
  private getWeekNumber(dayNumber: number): number {
    return Math.ceil(dayNumber / 7);
  }

// Główna metoda sprawdzająca

  private check35HourRestInAllWeeks(): void {
    const badWeeksMap = this.scheduleService.validate35HourRestInAllWeeks(
      this.employees,
      this.workHours,
      this.currentMonthDate()
    );

    this.badWeeks.set(badWeeksMap);
  }

  isCellSelected(employee: EmployeeRow, dayNumber: number): boolean {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return false;

    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    return selectedCell.employee.id === employee.id && selectedCell.date === dateString;
  }

  // Sprawdź czy komórka należy do złego tygodnia
  isCellInBadWeek(employee: EmployeeRow, dayNumber: number): boolean {
    const weekNumber = this.getWeekNumber(dayNumber);
    const employeeBadWeeks = this.badWeeks().get(employee.id.toString());
    return employeeBadWeeks ? employeeBadWeeks.has(weekNumber) : false;
  }

  private checkWorkHoursExceed12h(hoursString: string, employeeId: number, date: string): void {
    // Użyj metody z serwisu zamiast lokalnej logiki
    const validationResult = this.scheduleService.validateWorkHoursExceed12h(hoursString);
    const cellKey = `${employeeId}-${date}`;

    if (validationResult) {
      // Dodaj do sygnału
      const currentExceeding = this.exceedingWorkHours();
      currentExceeding.add(cellKey);
      this.exceedingWorkHours.set(new Set(currentExceeding));
    } else {
      // Usuń z sygnału jeśli nie przekracza już 12h
      const currentExceeding = this.exceedingWorkHours();
      if (currentExceeding.has(cellKey)) {
        currentExceeding.delete(cellKey);
        this.exceedingWorkHours.set(new Set(currentExceeding));
      }
    }
  }

  isCellExceeding12h(employee: EmployeeRow, dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    return this.exceedingWorkHours().has(cellKey);
  }

  onValidationError(error: {type: string, message: string} | null) {
    if (error) {
      this.dialog.open(NotificationPopUpComponent, {
        data: error,
        width: '400px',
        disableClose: false
      });
    }
  }

  private validateAndShowErrors(updatedData: any): void {
    const hoursString = updatedData.hours;
    const employeeId = updatedData.employee;
    const date = updatedData.date;

    // 1. Walidacja przekroczenia 12h
    const exceed12hError = this.scheduleService.validateWorkHoursExceed12h(hoursString);

    // 2. Walidacja konfliktów 11h
    const conflicts = this.scheduleService.validateRestTimeConflicts(
      this.employees,
      this.workHours,
      (empId: number, dateStr: string) => this.getAdjacentDaysHours(empId, dateStr)
    );
    const hasConflict11h = conflicts.has(`${employeeId}-${date}`);

    // 3. Walidacja 35h w tygodniu
    const badWeeks = this.scheduleService.validate35HourRestInAllWeeks(
      this.employees,
      this.workHours,
      this.currentMonthDate()
    );
    const dayNumber = new Date(date).getDate();
    const weekNumber = this.getWeekNumber(dayNumber);
    const employeeBadWeeks = badWeeks.get(employeeId.toString());
    const hasBadWeek35h = employeeBadWeeks ? employeeBadWeeks.has(weekNumber) : false;

    // Pokaż komunikat w kolejności priorytetów
    if (exceed12hError) {
      this.showNotification(exceed12hError);
    } else if (hasConflict11h) {
      this.showNotification({ type: 'conflict11h', message: 'Brak przerwy u pracownika 11h' });
    } else if (hasBadWeek35h) {
      this.showNotification({ type: 'badWeek35h', message: 'Brak przerwy 35h w tygodniu' });
    }
  }

  private showNotification(error: {type: string, message: string}): void {
    this.dialog.open(NotificationPopUpComponent, {
      data: error,
      width: '400px',
      disableClose: false
    });
  }


}
