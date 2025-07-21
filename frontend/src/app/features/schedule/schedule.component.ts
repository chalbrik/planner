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
import {MatButton, MatIconButton} from '@angular/material/button';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {EditScheduleComponentComponent} from './components/edit-schedule-component/edit-schedule-component.component';
import {
  BlancEditScheduleComponentComponent
} from './components/blanc-edit-schedule-component/blanc-edit-schedule-component.component';
import {IconComponent} from '../../shared/components/icon';

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

  constructor(
    private scheduleService: ScheduleService,
    private employeesService: EmployeesService,
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadWorkHours();

    this.scheduleService.scheduleUpdated$.subscribe((updatedData) => {
      const adjacentHours = this.getAdjacentDaysHours(updatedData.employee, updatedData.date);

      const timeDifferences = this.calculateTimeDifferences(
        updatedData.hours,
        adjacentHours.previousDay,
        adjacentHours.nextDay
      );

      console.log('Przerwa od poprzedniego dnia:', timeDifferences.restFromPrevious, 'h');
      console.log('Przerwa do następnego dnia:', timeDifferences.restToNext, 'h');
      this.loadWorkHours();
      this.selectedCell.set(undefined);

      this.checkRestTimeConflicts();
      // this.check35HourRestInAllWeeks();
    });

    // this.check35HourRestInAllWeeks();

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

    this.dataSource = this.employees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
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

  private calculateTimeDifferences(
    currentDayHours: string,
    previousDayHours: string | null,
    nextDayHours: string | null
  ): { restFromPrevious: number | null, restToNext: number | null } {

    const currentShift = this.parseWorkHours(currentDayHours);
    if (!currentShift) {
      return { restFromPrevious: null, restToNext: null };
    }

    let restFromPrevious = null;
    let restToNext = null;

    // Różnica między końcem poprzedniego dnia a początkiem obecnego
    if (previousDayHours) {
      const previousShift = this.parseWorkHours(previousDayHours);
      if (previousShift) {
        // Przerwa od końca poprzedniej zmiany do początku obecnej (w godzinach)
        restFromPrevious = (currentShift.startTime - previousShift.endTime) / 60;
        // Jeśli wynik ujemny, dodaj 24h (przejście przez północ)
        if (restFromPrevious < 0) {
          restFromPrevious += 24;
        }
      }
    }

    // Różnica między końcem obecnego dnia a początkiem następnego
    if (nextDayHours) {
      const nextShift = this.parseWorkHours(nextDayHours);
      if (nextShift) {
        // Przerwa od końca obecnej zmiany do początku następnej (w godzinach)
        restToNext = (nextShift.startTime - currentShift.endTime) / 60;
        // Jeśli wynik ujemny, dodaj 24h (przejście przez północ)
        if (restToNext < 0) {
          restToNext += 24;
        }
      }
    }

    return { restFromPrevious, restToNext };
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
    const conflicts = new Set<string>();

    this.employees.forEach(employee => {
      const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      employeeWorkHours.forEach(currentWorkHour => {
        const adjacentHours = this.getAdjacentDaysHours(employee.id, currentWorkHour.date);

        const timeDifferences = this.calculateTimeDifferences(
          currentWorkHour.hours,
          adjacentHours.previousDay,
          adjacentHours.nextDay
        );

        // Sprawdź przerwę od poprzedniego dnia
        if (timeDifferences.restFromPrevious !== null && timeDifferences.restFromPrevious < 11) {
          conflicts.add(`${employee.id}-${currentWorkHour.date}`);
        }

        // Sprawdź przerwę do następnego dnia
        if (timeDifferences.restToNext !== null && timeDifferences.restToNext < 11) {
          conflicts.add(`${employee.id}-${currentWorkHour.date}`);
        }
      });
    });

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
    console.log('=== Sprawdzanie wszystkich tygodni w miesiącu ===');

    const currentDate = this.currentMonthDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const numberOfWeeks = Math.ceil(daysInMonth / 7);
    const badWeeksMap = new Map<string, Set<number>>();

    console.log(`Miesiąc ma ${daysInMonth} dni, podzielonych na ${numberOfWeeks} tygodni`);

    this.employees.forEach(employee => {
      console.log(`\n--- Pracownik: ${employee.first_name} ${employee.last_name} ---`);

      const employeeShifts = this.workHours
        .filter(wh => wh.employee === employee.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log('Wszystkie zmiany:', employeeShifts.map(s => `${s.date}: ${s.hours}`));

      const employeeBadWeeks = new Set<number>();

      // Sprawdź każdy tydzień osobno
      for (let week = 1; week <= numberOfWeeks; week++) {
        const weekStart = (week - 1) * 7 + 1;
        const weekEnd = Math.min(week * 7, daysInMonth);

        console.log(`\n  Tydzień ${week} (dni ${weekStart}-${weekEnd}):`);

        // Pobierz zmiany z tego tygodnia
        const weekShifts = employeeShifts.filter(shift => {
          const day = new Date(shift.date).getDate();
          return day >= weekStart && day <= weekEnd;
        });

        console.log('  Zmiany w tym tygodniu:', weekShifts.map(s => `${s.date}: ${s.hours}`));

        // Oblicz wszystkie przerwy w tygodniu
        const restPeriods = this.calculateAllRestPeriodsInWeek(weekShifts, weekStart, weekEnd);

        console.log('  Wszystkie przerwy:');
        restPeriods.forEach((rest, index) => {
          console.log(`    Przerwa ${index + 1}: ${rest.hours}h (${rest.description})`);
        });

        // Sprawdź czy jest przynajmniej jedna przerwa >= 35h
        const hasLongRest = restPeriods.some(rest => rest.hours >= 35);
        const maxRest = Math.max(...restPeriods.map(r => r.hours));

        if (hasLongRest) {
          console.log(`  ✅ Tydzień ${week} - ma wymaganą 35h+ przerwę (najdłuższa: ${maxRest}h)`);
        } else {
          console.log(`  ❌ Tydzień ${week} - BRAK 35h przerwy (najdłuższa: ${maxRest}h)`);
          employeeBadWeeks.add(week);
        }
      }

      if (employeeBadWeeks.size > 0) {
        badWeeksMap.set(employee.id, employeeBadWeeks);
      }
    });

    this.badWeeks.set(badWeeksMap);
  }

  private calculateAllRestPeriodsInWeek(weekShifts: any[], weekStart: number, weekEnd: number): Array<{hours: number, description: string}> {
    const restPeriods: Array<{hours: number, description: string}> = [];

    if (weekShifts.length === 0) {
      // Cały tydzień wolny
      const totalWeekHours = (weekEnd - weekStart + 1) * 24;
      restPeriods.push({
        hours: totalWeekHours,
        description: `Cały tydzień wolny (${weekEnd - weekStart + 1} dni)`
      });
      return restPeriods;
    }

    // Stwórz datę początku i końca tygodnia
    const currentDate = this.currentMonthDate();
    const weekStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), weekStart, 0, 0, 0);
    const weekEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), weekEnd, 23, 59, 59);

    // 1. Przerwa od początku tygodnia do pierwszej zmiany
    const firstShift = weekShifts[0];
    const firstShiftStart = this.parseShiftStartTime(firstShift);

    if (firstShiftStart) {
      const restFromWeekStart = (firstShiftStart.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60);
      if (restFromWeekStart > 0) {
        restPeriods.push({
          hours: Math.round(restFromWeekStart * 100) / 100,
          description: `Od początku tygodnia do ${firstShift.date}`
        });
      }
    }

    // 2. Przerwy między zmianami
    for (let i = 0; i < weekShifts.length - 1; i++) {
      const currentShiftEnd = this.parseShiftEndTime(weekShifts[i]);
      const nextShiftStart = this.parseShiftStartTime(weekShifts[i + 1]);

      if (currentShiftEnd && nextShiftStart) {
        const restBetween = (nextShiftStart.getTime() - currentShiftEnd.getTime()) / (1000 * 60 * 60);
        if (restBetween > 0) {
          restPeriods.push({
            hours: Math.round(restBetween * 100) / 100,
            description: `${weekShifts[i].date} -> ${weekShifts[i + 1].date}`
          });
        }
      }
    }

    // 3. Przerwa od ostatniej zmiany do końca tygodnia
    const lastShift = weekShifts[weekShifts.length - 1];
    const lastShiftEnd = this.parseShiftEndTime(lastShift);

    if (lastShiftEnd) {
      const restToWeekEnd = (weekEndDate.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60);
      if (restToWeekEnd > 0) {
        restPeriods.push({
          hours: Math.round(restToWeekEnd * 100) / 100,
          description: `Od ${lastShift.date} do końca tygodnia`
        });
      }
    }

    return restPeriods;
  }

  private parseShiftStartTime(shift: any): Date | null {
    const match = shift.hours.match(/(\d{1,2}):(\d{2})-\d{1,2}:\d{2}/);
    if (!match) return null;

    const date = new Date(shift.date);
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    return date;
  }

  private parseShiftEndTime(shift: any): Date | null {
    const match = shift.hours.match(/\d{1,2}:\d{2}-(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const date = new Date(shift.date);
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    return date;
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


}
