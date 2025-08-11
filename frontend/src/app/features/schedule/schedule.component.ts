import {Component, OnInit, signal, computed, ViewEncapsulation, inject, OnDestroy} from '@angular/core';
import {ScheduleService} from '../../core/services/schedule/schedule.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MatCell, MatCellDef, MatColumnDef,
  MatFooterCell, MatFooterCellDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatIconButton} from '@angular/material/button';
import {EmployeesService} from '../../core/services/employees/employees.service';
import {IconComponent} from '../../shared/components/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotificationPopUpComponent } from './components/notification-pop-up/notification-pop-up.component'; // sprawdź ścieżkę!
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {CellEditPopupComponent} from './components/cell-edit-popup/cell-edit-popup.component';
import {timer} from 'rxjs';


interface Day {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isSaturday: boolean;
  isSunday: boolean;
}

interface EmployeeRow {
  id: string;
  name: string;
  workHours: { [key: string]: string }; // klucz to data w formacie YYYY-MM-DD, wartość to godziny pracy
  agreement_type?: 'permanent' | 'contract';
  isSeparator?: boolean;
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
    IconComponent,
    MatIconButton,
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class ScheduleComponent implements OnInit, OnDestroy {

  private readonly dialog = inject(MatDialog);
  private readonly scheduleService = inject(ScheduleService);
  private readonly employeesService = inject(EmployeesService);
  private readonly overlay = inject(Overlay);

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
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isSaturday: dayOfWeek === 6,
        isSunday: dayOfWeek === 0,
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

  private overlayRef?: OverlayRef;

  dayColumnWidth = signal<number>(55);

  permanentDataSource = signal<EmployeeRow[]>([]);
  contractDataSource = signal<EmployeeRow[]>([]);

  constructor() {}

  ngOnInit() {
    this.loadEmployees();
    this.loadWorkHours();

    this.setupResponsiveColumns();

    this.scheduleService.scheduleUpdated$.subscribe((updatedData) => {
      this.loadWorkHours();

      // Użyj timer Observable
      timer(800).subscribe(() => {
        this.checkRestTimeConflicts();
        this.validateAndShowErrors(updatedData);
      });

      this.selectedCell.set(undefined);
    });
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.calculateDayColumnWidth.bind(this));
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private setupResponsiveColumns(): void {
    // Oblicz szerokość przy inicjalizacji
    this.calculateDayColumnWidth();

    // Nasłuchuj zmian rozmiaru okna
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.calculateDayColumnWidth();
      });
    }
  }

  private calculateDayColumnWidth(): void {
    if (typeof window === 'undefined') return;

    const screenWidth = window.innerWidth;
    const isLargeScreen = screenWidth >= 1024; // lg breakpoint

    if (!isLargeScreen) {
      this.dayColumnWidth.set(55); // Domyślna szerokość
      this.updateCSSCustomProperty(55);
      return;
    }

    // Oblicz dostępną przestrzeń na ekranach lg+
    const fixedColumnsWidth = 400 + 80 + 64; // Pracownicy + Suma + margines
    const availableWidth = screenWidth - fixedColumnsWidth;
    const numberOfDays = this.monthDays().length;

    // Oblicz szerokość komórki
    const calculatedWidth = Math.floor(availableWidth / numberOfDays);
    const finalWidth = Math.max(calculatedWidth, 40); // Min 40px

    this.dayColumnWidth.set(finalWidth);
    this.updateCSSCustomProperty(finalWidth);
  }

  private updateCSSCustomProperty(width: number): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--day-column-width', `${width}px`);
    }
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

  // prepareTableData() {
  //   if (this.employees.length === 0) return;
  //
  //   this.dataSource = this.employees.map(employee => {
  //     const workHoursMap: { [key: string]: string } = {};
  //     const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);
  //
  //     employeeWorkHours.forEach(wh => {
  //       workHoursMap[wh.date] = wh.hours;
  //       this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
  //     });
  //
  //     return {
  //       id: employee.id,
  //       name: `${employee.first_name} ${employee.last_name}`,
  //       workHours: workHoursMap
  //     };
  //   });
  //
  //   this.checkRestTimeConflicts();
  //   this.check35HourRestInAllWeeks();
  // }

  // prepareTableData() {
  //   if (this.employees.length === 0) return;
  //
  //   // Podziel pracowników na grupy
  //   const permanentEmployees = this.employees.filter(emp => emp.agreement_type === 'permanent');
  //   const contractEmployees = this.employees.filter(emp => emp.agreement_type === 'contract');
  //
  //   // Przygotuj dane dla UoP (Umowa o Pracę)
  //   const permanentRows = permanentEmployees.map(employee => {
  //     const workHoursMap: { [key: string]: string } = {};
  //     const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);
  //
  //     employeeWorkHours.forEach(wh => {
  //       workHoursMap[wh.date] = wh.hours;
  //       this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
  //     });
  //
  //     return {
  //       id: employee.id,
  //       name: `${employee.first_name} ${employee.last_name}`,
  //       workHours: workHoursMap,
  //       agreement_type: employee.agreement_type
  //     };
  //   });
  //
  //   // Separator - tylko jeśli są pracownicy w obu grupach
  //   const rows: EmployeeRow[] = [...permanentRows];
  //
  //   if (contractEmployees.length > 0 && permanentEmployees.length > 0) {
  //     const separatorRow: EmployeeRow = {
  //       id: 'separator',
  //       name: '',
  //       workHours: {},
  //       isSeparator: true
  //     };
  //     rows.push(separatorRow);
  //   }
  //
  //   // Przygotuj dane dla UZ (Umowa na Zlecenie)
  //   const contractRows = contractEmployees.map(employee => {
  //     const workHoursMap: { [key: string]: string } = {};
  //     const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);
  //
  //     employeeWorkHours.forEach(wh => {
  //       workHoursMap[wh.date] = wh.hours;
  //       this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
  //     });
  //
  //     return {
  //       id: employee.id,
  //       name: `${employee.first_name} ${employee.last_name}`,
  //       workHours: workHoursMap,
  //       agreement_type: employee.agreement_type
  //     };
  //   });
  //
  //   // Połącz wszystko
  //   rows.push(...contractRows);
  //   this.dataSource = rows;
  //
  //   this.checkRestTimeConflicts();
  //   this.check35HourRestInAllWeeks();
  // }

  prepareTableData() {
    if (this.employees.length === 0) {
      this.permanentDataSource.set([]);
      this.contractDataSource.set([]);
      return;
    }

    // Podziel pracowników na grupy
    const permanentEmployees = this.employees.filter(emp => emp.agreement_type === 'permanent');
    const contractEmployees = this.employees.filter(emp => emp.agreement_type === 'contract');

    // Przygotuj dane dla UoP (Umowa o Pracę)
    const permanentRows = permanentEmployees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
      const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
        this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
      });

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        workHours: workHoursMap,
        agreement_type: employee.agreement_type
      };
    });

    // Przygotuj dane dla UZ (Umowa na Zlecenie)
    const contractRows = contractEmployees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
      const employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
        this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
      });

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        workHours: workHoursMap,
        agreement_type: employee.agreement_type
      };
    });

    // Ustaw sygnały zamiast jednego dataSource
    this.permanentDataSource.set(permanentRows);
    this.contractDataSource.set(contractRows);

    // Zachowaj stary dataSource dla kompatybilności (opcjonalnie możesz go usunąć później)
    this.dataSource = [...permanentRows, ...contractRows];

    this.checkRestTimeConflicts();
    this.check35HourRestInAllWeeks();
  }


  // Metoda do pobierania godzin pracy dla konkretnego dnia i pracownika
  getWorkHoursForDay(employee: EmployeeRow, dayNumber: number): string {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    return employee.workHours[dateString] || '';
  }

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
    this.loadWorkHours();

    // Przelicz szerokość dla nowego miesiąca
    this.calculateDayColumnWidth();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  getMonthName(): string {
    const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const currentDate = this.currentMonthDate();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  // onCellClick(employee: EmployeeRow, dayNumber: number) {
  //   const currentDate = this.currentMonthDate();
  //   const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  //
  //   const workHoursObject = this.workHours.find(wh =>
  //     wh.employee === employee.id && wh.date === dateString
  //   );
  //   this.selectedCell.set({
  //     employee: employee,
  //     workHours: workHoursObject || null,
  //     date: dateString
  //   });
  //
  // }

  onCellClick(employee: EmployeeRow, dayNumber: number, event: MouseEvent) {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    // Przygotuj dane selectedCell
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    const workHoursObject = this.workHours.find(wh =>
      wh.employee === employee.id && wh.date === dateString
    );

    const selectedCellData = {
      employee: employee,
      workHours: workHoursObject || null,
      date: dateString
    };

    // Tylko zaznacz komórkę - zachowaj w sygnale
    this.selectedCell.set(selectedCellData);
  }

  onDbCellClick(employee: EmployeeRow, dayNumber: number, event: MouseEvent) {
    // Zamknij poprzedni overlay jeśli istnieje
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    // Przygotuj dane selectedCell (można też użyć this.selectedCell() jeśli była już zaznaczona)
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    const workHoursObject = this.workHours.find(wh =>
      wh.employee === employee.id && wh.date === dateString
    );

    const selectedCellData = {
      employee: employee,
      workHours: workHoursObject || null,
      date: dateString
    };

    // Pobierz element komórki
    const cellElement = event.target as HTMLElement;

    // Stwórz strategię pozycjonowania
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(cellElement)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8
        },
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8
        }
      ]);

    // Stwórz overlay
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closePopup();
    });

    // Stwórz portal komponentu
    const portal = new ComponentPortal(CellEditPopupComponent);

    // Podłącz komponent do overlay
    const componentRef = this.overlayRef.attach(portal);

    // Przekaż selectedCell
    componentRef.setInput('selectedCell', selectedCellData);

    // Obsłuż eventy z komponentu
    componentRef.instance.save.subscribe((data) => {
      this.onPopupSave(data);
    });

    componentRef.instance.cancel.subscribe(() => {
      this.onPopupCancel();
    });

    componentRef.instance.delete.subscribe((data) => {
      this.onPopupDelete(data);
    });

    // Zaktualizuj sygnał
    this.selectedCell.set(selectedCellData);
  }

  private onPopupSave(data: { hours: string; employee: string; date: string; id?: string }) {
    if (data.id) {
      // Update istniejących godzin
      this.scheduleService.updateWorkHours(data.id, {
        hours: data.hours,
        employee: data.employee,
        date: data.date
      }).subscribe({
        next: (updatedData) => {
          this.scheduleService.emitScheduleUpdate(updatedData);
          this.closePopup();
        },
        error: (error) => {
          console.error('Błąd podczas aktualizacji godzin:', error);
          // Tu możesz dodać obsługę błędów
        }
      });
    } else {
      // Dodaj nowe godziny
      this.scheduleService.addWorkHours({
        hours: data.hours,
        employee: data.employee,
        date: data.date
      }).subscribe({
        next: (newData) => {
          this.scheduleService.emitScheduleUpdate(newData);
          this.closePopup();
        },
        error: (error) => {
          console.error('Błąd podczas dodawania godzin:', error);
          // Tu możesz dodać obsługę błędów
        }
      });
    }
  }

  private onPopupCancel() {
    console.log('Popup cancel');
    this.closePopup();
  }

  private onPopupDelete(data: { id: string }) {
    this.scheduleService.deleteWorkHours(data.id).subscribe({
      next: () => {
        // Emit schedule update z informacją o usunięciu
        this.scheduleService.emitScheduleUpdate({ deleted: true, id: data.id });
        this.closePopup();
      },
      error: (error) => {
        console.error('Błąd podczas usuwania godzin:', error);
        // Tu możesz dodać obsługę błędów
      }
    });
  }

  private closePopup() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
    this.selectedCell.set(undefined);
  }

  onCancelSelection() {
    this.selectedCell.set(undefined);
  }


  //Pobieranie godzin z dnia poprzedniego oraz nastepnego
  private getAdjacentDaysHours(employeeId: string, currentDate: string): { previousDay: string | null, nextDay: string | null } {
    const currentDateObj = new Date(currentDate);
    // console.log('employeeId', employeeId);
    // console.log('currentDate ', currentDate);

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

  private checkRestTimeConflicts(): void {
    const conflicts = this.scheduleService.validateRestTimeConflicts();

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
    const badWeeksMap = this.scheduleService.validate35HourRestInAllWeeks(this.currentMonthDate());

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

  private validateAndShowErrors(updatedData: any): void {
    const hoursString = updatedData.hours;
    const employeeId = updatedData.employee;
    const date = updatedData.date;


    // 1. Walidacja przekroczenia 12h
    const exceed12hError = this.scheduleService.validateWorkHoursExceed12h(hoursString);

    // 2. Walidacja konfliktów 11h
    const conflicts = this.scheduleService.validateRestTimeConflicts();
    const hasConflict11h = conflicts.has(`${employeeId}-${date}`);

    // 3. Walidacja 35h w tygodniu
    const badWeeks = this.scheduleService.validate35HourRestInAllWeeks(this.currentMonthDate());
    const dayNumber = new Date(date).getDate();
    const weekNumber = this.getWeekNumber(dayNumber);
    const employeeBadWeeks = badWeeks.get(employeeId.toString());
    const hasBadWeek35h = employeeBadWeeks ? employeeBadWeeks.has(weekNumber) : false;


    // Pokaż komunikat w kolejności priorytetów
    if (exceed12hError) {
      this.showNotification(exceed12hError);
    }
    if (hasConflict11h) {
      this.showNotification({ type: 'conflict11h', message: 'Brak przerwy u pracownika 11h' });
    }
    if (hasBadWeek35h) {
      this.showNotification({ type: 'badWeek35h', message: 'Brak przerwy 35h w tygodniu' });
    }
  }

  private showNotification(error: {type: string, message: string}): void {
    // Sprawdź ile dialogów jest już otwartych
    const openDialogs = this.dialog.openDialogs.length;

    this.dialog.open(NotificationPopUpComponent, {
      data: error,
      width: '400px',
      disableClose: false,
      position: {
        top: `${50 + (openDialogs * 80)}px`,  // Każdy kolejny o 120px niżej
        right: '20px'                           // Wszystkie po prawej stronie
      }
    });

  }


}
