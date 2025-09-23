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
import {Subject, takeUntil, timer} from 'rxjs';
import {LocationService} from '../../core/services/locations/location.service';
import {Location} from '../../core/services/locations/location.types';
import {Employee} from '../../core/services/employees/employee.types';
import {WorkHours} from '../../core/services/schedule/schedule.types';
import {ConflictService} from '../../core/services/conflicts/conflict.service';
import {SelectInputComponent} from '../../shared/components/select-input/select-input.component';
import {HolidayService} from '../../core/services/holiday/holiday.service';
import {HoursFormatPipe} from '../../shared/pipes/hours-format.pipe';


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
  job: number;
  hoursToWork?: number;
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
    SelectInputComponent,
    HoursFormatPipe,
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
  private readonly locationService = inject(LocationService);
  private readonly conflictService = inject(ConflictService);
  private holidayService = inject(HolidayService);

  employees: Employee[] = [];
  workHours: WorkHours[] = [];
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
  permanentDisplayedColumns = computed(() => {
    const days = this.monthDays();
    const dayColumns = days.map(day => `day-${day.dayNumber}`);
    return ['employees', ...dayColumns, 'hoursSum', 'job']; // Z kolumną "job"
  });

  contractDisplayedColumns = computed(() => {
    const days = this.monthDays();
    const dayColumns = days.map(day => `day-${day.dayNumber}`);
    return ['employees', ...dayColumns, 'hoursSum']; // BEZ kolumny "job"
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

  locations = signal<Location[]>([]);
  locationOptions = computed(() =>
    this.locations().map(location => ({
      value: location.id,
      label: location.name
    }))
  );
  selectedLocationId = signal<string>('');

  workingDaysInMonth = signal<number>(0);


  private subscriptions = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.loadLocations();
    this.setupResponsiveColumns();
    this.setupSubscriptions();

    this.loadWorkingDaysAndCalculateHours();



    // setTimeout(() => {
    //   this.showNotification({ type: 'conflict11h', message: 'Brak przerwy u pracownika 11h' });
    //
    //   this.showNotification({ type: 'badWeek35h', message: 'Brak przerwy 35h w tygodniu' });
    // }, 1000);




  }

  ngOnDestroy() {
    this.subscriptions.next();
    this.subscriptions.complete();
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

  private loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locations.set(locations);

        if (locations && locations.length > 0) {
          const firstLocationId = locations[0].id;
          this.onLocationChange(firstLocationId);
        } else {
          this.errorMessage = 'Brak dostępnych lokacji';
        }
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować lokacji';
        console.error('Błąd ładowania lokacji:', error);
      }
    });
  }

  prepareTableData() {
    if (this.employees.length === 0) {
      this.permanentDataSource.set([]);
      this.contractDataSource.set([]);
      return;
    }

    // Filtruj pracowników po wybranej lokacji
    let filteredEmployees = this.employees;
    const selectedLocationId = this.selectedLocationId();

    if (selectedLocationId) {
      filteredEmployees = this.employees.filter(emp =>
        emp.locations && emp.locations.includes(selectedLocationId)
      );
    }

    // Podziel przefiltrowanych pracowników na grupy
    const permanentEmployees = filteredEmployees.filter(emp => emp.agreement_type === 'permanent');
    const contractEmployees = filteredEmployees.filter(emp => emp.agreement_type === 'contract');

    // Pobierz aktualną liczbę dni roboczych
    const workingDays = this.workingDaysInMonth();

    // Przygotuj dane dla UoP (Umowa o Pracę)
    const permanentRows = permanentEmployees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
      let employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      // Jeśli wybrana lokacja, filtruj też godziny pracy po lokacji
      if (selectedLocationId) {
        employeeWorkHours = employeeWorkHours.filter(wh => wh.location === selectedLocationId);
      }

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
        this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
      });

      const jobRate = parseFloat(employee.job) || 0;

      return {
        id: employee.id,
        name: `${employee.full_name}`,
        workHours: workHoursMap,
        agreement_type: employee.agreement_type,
        job: jobRate,
        hoursToWork: this.calculateHoursToWorkForEmployee(jobRate, workingDays)
      };
    });

    // Przygotuj dane dla UZ (Umowa na Zlecenie)
    const contractRows = contractEmployees.map(employee => {
      const workHoursMap: { [key: string]: string } = {};
      let employeeWorkHours = this.workHours.filter(wh => wh.employee === employee.id);

      // Jeśli wybrana lokacja, filtruj też godziny pracy po lokacji
      if (selectedLocationId) {
        employeeWorkHours = employeeWorkHours.filter(wh => wh.location === selectedLocationId);
      }

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
        this.checkWorkHoursExceed12h(wh.hours, wh.employee, wh.date);
      });

      const jobRate = parseFloat(employee.job) || 0;

      return {
        id: employee.id,
        name: `${employee.full_name}`,
        workHours: workHoursMap,
        agreement_type: employee.agreement_type,
        job: jobRate,
        hoursToWork: this.calculateHoursToWorkForEmployee(jobRate, workingDays)
      };
    });

    // Ustaw sygnały zamiast jednego dataSource
    this.permanentDataSource.set(permanentRows);
    this.contractDataSource.set(contractRows);

    // Zachowaj stary dataSource dla kompatybilności
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
    const currentDate = this.currentMonthDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Iteruj tylko przez godziny z bieżącego miesiąca
    Object.entries(employee.workHours).forEach(([dateString, hoursString]) => {
      if (hoursString) {
        // Sprawdź czy data należy do bieżącego miesiąca
        const workDate = new Date(dateString);
        if (workDate.getFullYear() === currentYear && workDate.getMonth() + 1 === currentMonth) {

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
      }
    });

    return Math.round(totalHours * 100) / 100;
  }

  // Metoda do zmiany miesiąca
  changeMonth(direction: number) {
    const current = this.currentMonthDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    this.currentMonthDate.set(newDate);
    this.loadWorkHoursForLocation();

    // Przelicz szerokość dla nowego miesiąca
    this.calculateDayColumnWidth();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    // Pobierz dni robocze dla nowego miesiąca i przelicz godziny do dyspozycji
    this.loadWorkingDaysAndCalculateHours();
  }

  getMonthName(): string {
    const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const currentDate = this.currentMonthDate();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  onCellClick(employee: EmployeeRow, dayNumber: number, event: MouseEvent) {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    // Przygotuj dane selectedCell
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    const workHoursObject: WorkHours | undefined = this.workHours.find(wh =>
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

    const currentLocationId = this.selectedLocationId();

    const workHoursObject: WorkHours | undefined = this.workHours.find(wh =>
      wh.employee === employee.id &&
      wh.date === dateString &&
      wh.location === currentLocationId
    );

    const selectedCellData = {
      employee: employee,
      workHours: workHoursObject || null,
      date: dateString,
      location: currentLocationId
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
        date: data.date,
        location: this.selectedLocationId()
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
        date: data.date,
        location: this.selectedLocationId()
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
    // console.log('Popup cancel');
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

  private checkRestTimeConflicts(): void {
    const selectedLocationId = this.selectedLocationId();
    if (!selectedLocationId) return;

    const locationWorkHours = this.workHours.filter(wh => wh.location === selectedLocationId);

    const conflicts = this.conflictService.validateRestTimeConflicts(locationWorkHours, this.employees);
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
    const selectedLocationId = this.selectedLocationId();
    if (!selectedLocationId) return;

    const locationWorkHours = this.workHours.filter(wh => wh.location === selectedLocationId);

    const badWeeksMap = this.conflictService.validate35HourRest(locationWorkHours, this.employees, this.currentMonthDate());
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

  private checkWorkHoursExceed12h(hoursString: string, employeeId: string, date: string): void {
    // Użyj metody z serwisu zamiast lokalnej logiki
    const validationResult = this.conflictService.validateWorkHoursExceed12h(hoursString);
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
    const exceed12hError = this.conflictService.validateWorkHoursExceed12h(hoursString);

    // 2. Walidacja konfliktów 11h
    const selectedLocationId = this.selectedLocationId();
    const locationWorkHours = this.workHours.filter(wh => wh.location === selectedLocationId);
    const conflicts = this.conflictService.validateRestTimeConflicts(locationWorkHours, this.employees);
    const hasConflict11h = conflicts.has(`${employeeId}-${date}`);

    // 3. Walidacja 35h w tygodniu
    const badWeeks = this.conflictService.validate35HourRest(locationWorkHours, this.employees, this.currentMonthDate());
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
        top: `${90 + (openDialogs * 90)}px`,  // Każdy kolejny o 120px niżej
        right: '0'                           // Wszystkie po prawej stronie
      }
    })

  }


  onLocationChange(locationId: string): void {
    // console.log('onLocationChange wywołane z locationId:', locationId);

    if (!locationId) {
      const firstLocation = this.locations()[0];
      if (firstLocation) {
        this.selectedLocationId.set(firstLocation.id);
        this.onLocationChange(firstLocation.id);
      }
      return;
    }

    // Zawsze czyść stan przy zmianie lokacji
    this.clearConflicts();
    this.clearTableState();
    this.selectedLocationId.set(locationId);
    this.loadDataForLocation();
  }

  /**
   * Czyści wszystkie sygnały związane z konfliktami
   */
  private clearConflicts(): void {
    this.conflictingCells.set(new Set());
    this.badWeeks.set(new Map());
    this.exceedingWorkHours.set(new Set());

    // Opcjonalnie - wyczyść cache jeśli używasz
    // this.scheduleService.clearConflictCache(); // jeśli będziemy dodawać cache
  }

  /**
   * Czyści stan tabeli i interfejsu użytkownika
   */
  private clearTableState(): void {
    // Wyczyść wybrane komórki
    this.selectedCell.set(undefined);

    // Wyczyść dane tabeli
    this.dataSource = [];
    this.permanentDataSource.set([]);
    this.contractDataSource.set([]);

    // Zamknij popup edycji jeśli jest otwarty
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }

    // Zamknij wszystkie otwarte dialogi z powiadomieniami
    this.dialog.closeAll();
  }

  private loadDataForLocation(): void {
    this.isLoading = true;

    Promise.all([
      this.loadEmployeesForLocation(),
      this.loadWorkHoursForLocation()
    ]).then(() => {
      this.prepareTableData();
      this.checkAllConflictsForCurrentLocation();
      this.isLoading = false;
    }).catch((error) => {
      this.errorMessage = 'Nie udało się załadować danych dla lokacji';
      this.isLoading = false;
      console.error('Błąd ładowania danych dla lokacji:', error);
    });
  }

  private loadEmployeesForLocation(): Promise<Employee[]> {
    return new Promise((resolve, reject) => {
      const selectedLocationId = this.selectedLocationId();
      const params = selectedLocationId ? { location: selectedLocationId } : {};

      this.employeesService.getEmployees(params).subscribe({
        next: (data) => {
          if (Array.isArray(data)) {
            console.log(data);
            this.employees = data;
            resolve(data);
          } else {
            this.employees = [];
            resolve([]);
          }
        },
        error: (error) => {
          console.error('Błąd ładowania pracowników:', error);
          reject(error);
        }
      });
    });
  }

  private loadWorkHoursForLocation(): Promise<WorkHours[]> {
    return new Promise((resolve, reject) => {
      const currentDate = this.currentMonthDate();
      const selectedLocationId = this.selectedLocationId();

      const filters = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        // ✅ KLUCZOWA ZMIANA: Dodaj filtrowanie według lokacji
        location: selectedLocationId
      };

      this.scheduleService.getWorkHours(filters).subscribe({
        next: (data) => {
          this.workHours = data;
          resolve(data);
        },
        error: (error) => {
          console.error('Błąd ładowania harmonogramu:', error);
          reject(error);
        }
      });
    });
  }

  private checkAllConflictsForCurrentLocation(): void {
    const selectedLocationId = this.selectedLocationId();

    if (!selectedLocationId) {
      console.warn('Brak wybranej lokacji - pomijam sprawdzanie konfliktów');
      return;
    }

    // Sprawdź konflikty używając nowych metod serwisu z filtrowaniem
    this.checkRestTimeConflicts();
    this.check35HourRestInAllWeeks();
  }


  private setupSubscriptions(): void {
    this.scheduleService.scheduleUpdated$.pipe(takeUntil(this.subscriptions)).subscribe((updatedData) => {
      this.loadWorkHoursForLocation().then(() => {
        this.prepareTableData();

        timer(800).subscribe(() => {
          this.checkAllConflictsForCurrentLocation();
          this.validateAndShowErrors(updatedData);
        });
      });

      this.selectedCell.set(undefined);
    });
  }

  private loadWorkingDaysAndCalculateHours(): void {
    const currentDate = this.currentMonthDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    this.holidayService.calculateWorkingDaysInMonth(year, month).subscribe({
      next: (workingDays) => {
        this.workingDaysInMonth.set(workingDays);
        console.log(`Dni robocze w ${month}/${year}: ${workingDays}`);

        // Po pobraniu dni roboczych, przelicz godziny dla każdego pracownika
        this.recalculateHoursToWork(workingDays);
      },
      error: (error) => {
        console.error('Błąd podczas pobierania dni roboczych:', error);
        // W przypadku błędu, oblicz bez świąt
        const fallbackWorkingDays = this.calculateWorkingDaysWithoutHolidays();
        this.workingDaysInMonth.set(fallbackWorkingDays);
        this.recalculateHoursToWork(fallbackWorkingDays);
      }
    });
  }

  private calculateWorkingDaysWithoutHolidays(): number {
    const currentDate = this.currentMonthDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }

  private recalculateHoursToWork(workingDays: number): void {
    // Przelicz dla stałych pracowników
    const updatedPermanent = this.permanentDataSource().map(employee => ({
      ...employee,
      hoursToWork: this.calculateHoursToWorkForEmployee(employee.job, workingDays)
    }));
    this.permanentDataSource.set(updatedPermanent);

    // Przelicz dla pracowników na zlecenie
    const updatedContract = this.contractDataSource().map(employee => ({
      ...employee,
      hoursToWork: this.calculateHoursToWorkForEmployee(employee.job, workingDays)
    }));
    this.contractDataSource.set(updatedContract);

    // Aktualizuj główny dataSource dla kompatybilności
    this.dataSource = [...updatedPermanent, ...updatedContract];
  }

  private calculateHoursToWorkForEmployee(jobRate: number, workingDays: number): number {
    // job * dni robocze * 8h
    // np. 1.0 * 22 * 8 = 176h dla pełnego etatu
    // np. 0.5 * 22 * 8 = 88h dla pół etatu
    return Math.round(jobRate * workingDays * 8);
  }

  getColumnsForTable(showJobColumn: boolean): string[] {
    const days = this.monthDays();
    const dayColumns = days.map(day => `day-${day.dayNumber}`);
    return ['employees', ...dayColumns, 'summary']; // Zawsze 'summary' zamiast 'hoursSum' i 'job'
  }

}
