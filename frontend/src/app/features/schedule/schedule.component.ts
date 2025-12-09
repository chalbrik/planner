import {
  Component,
  OnInit,
  signal,
  computed,
  ViewEncapsulation,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  effect, untracked
} from '@angular/core';
import {ConflictData} from '../../core/services/schedule/schedule.service';
import {ScheduleFacade} from '../../core/services/schedule/schedule.facade';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MatCell, MatCellDef, MatColumnDef,
  MatFooterCell, MatFooterCellDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatButton, MatIconButton} from '@angular/material/button';
import {IconComponent} from '../../shared/components/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotificationPopUpComponent } from './components/notification-pop-up/notification-pop-up.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {CellEditPopupComponent} from './components/cell-edit-popup/cell-edit-popup.component';
import {Subject, takeUntil, timer} from 'rxjs';
import {WorkHours} from '../../core/services/schedule/schedule.types';
import {HoursFormatPipe} from '../../shared/pipes/hours-format.pipe';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatTab, MatTabsModule} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';


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
    IconComponent,
    MatIconButton,
    HoursFormatPipe,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatRowDef,
    MatHeaderRowDef,
    MatCellDef,
    MatHeaderCellDef,
    MatFooterCellDef,
    MatButton,
    MatTab,
    MatTabsModule,
    MatIcon,
    MatInput,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent implements OnInit, OnDestroy {

  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  protected readonly facade = inject(ScheduleFacade);

  // Deleguj sygnały z facade (dla łatwiejszego dostępu w template)
  employees = this.facade.employees;
  workHours = this.facade.workHours;
  isLoading = this.facade.isLoading;
  errorMessage = this.facade.error;
  currentMonthDate = this.facade.currentMonthDate;

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

  // Przygotowane dane dla tabeli
  dataSource: EmployeeRow[] = [];

  selectedCell = signal<{
    employee: any;
    workHours: any;
    date: string
  } | undefined>(undefined);

  selectedCells = this.facade.selectedCells;
  lastClickedCell = signal<{ employeeId: string; date: string } | null>(null); // dla Shift+click

  conflictingCells = this.facade.conflictingCells;
  badWeeks = this.facade.badWeeks;
  exceedingWorkHours = this.facade.exceedingWorkHours;

  private overlayRef?: OverlayRef;

  dayColumnWidth = signal<number>(55);

  permanentDataSource = signal<EmployeeRow[]>([]);
  contractDataSource = signal<EmployeeRow[]>([]);

  locations = this.facade.locations;
  locationOptions = this.facade.locationOptions;
  selectedLocationId = this.facade.selectedLocationId;
  locationControl = new FormControl<string>('');

  workingDaysInMonth = this.facade.workingDaysInMonth;

  private subscriptions = new Subject<void>();

  searchQuery = signal<string>('');

  viewModeIndex = signal<number>(0);

  customEmployeeOrder = signal<any[]>([]);

  allEmployeesDataSource = computed(() => {
    // Sprawdź czy jest custom order
    const customOrder = this.customEmployeeOrder();
    if (customOrder.length > 0) {
      // Użyj custom order i przefiltruj po search
      const query = this.searchQuery().toLowerCase().trim();
      if (query) {
        return customOrder.filter(employee =>
          employee.name.toLowerCase().includes(query)
        );
      }
      return customOrder;
    }

    // Domyślnie połącz obie listy
    const allEmployees = [
      ...this.permanentDataSource(),
      ...this.contractDataSource()
    ];

    // Filtruj po nazwisku
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      return allEmployees.filter(employee =>
        employee.name.toLowerCase().includes(query)
      );
    }

    return allEmployees;
  });

  constructor() {
    effect(() => {
      const employees = this.employees();
      const workHours = this.workHours();
      const selectedLocationId = this.selectedLocationId();

      if (employees.length > 0 && selectedLocationId) {
        untracked(() => this.prepareTableData());
      }
    });
  }

  ngOnInit(): void {
    // Załaduj lokacje przez facade
    this.facade.loadLocations().subscribe();

    this.setupResponsiveColumns();
    this.setupSubscriptions();

    // Załaduj dni robocze
    this.facade.loadWorkingDays();

    this.locationControl.valueChanges
      .pipe(takeUntil(this.subscriptions))
      .subscribe((locationId) => {
        if (locationId) {
          this.onLocationChange(locationId);
        }
      });
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

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
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

  onEmployeeDrop(event: CdkDragDrop<any[]>) {
    const data = [...this.allEmployeesDataSource()];
    moveItemInArray(data, event.previousIndex, event.currentIndex);
    this.customEmployeeOrder.set(data);
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


  prepareTableData() {
    const employees = this.employees();
    const workHours = this.workHours();

    if (employees.length === 0) {
      this.permanentDataSource.set([]);
      this.contractDataSource.set([]);
      return;
    }

    // Filtruj pracowników po wybranej lokacji
    let filteredEmployees = employees;
    const selectedLocationId = this.selectedLocationId();

    if (selectedLocationId) {
      filteredEmployees = employees.filter(emp =>
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
      let employeeWorkHours = workHours.filter(wh => wh.employee === employee.id);

      // Jeśli wybrana lokacja, filtruj też godziny pracy po lokacji
      if (selectedLocationId) {
        employeeWorkHours = employeeWorkHours.filter(wh => wh.location === selectedLocationId);
      }

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
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
      let employeeWorkHours = workHours.filter(wh => wh.employee === employee.id);

      // Jeśli wybrana lokacja, filtruj też godziny pracy po lokacji
      if (selectedLocationId) {
        employeeWorkHours = employeeWorkHours.filter(wh => wh.location === selectedLocationId);
      }

      employeeWorkHours.forEach(wh => {
        workHoursMap[wh.date] = wh.hours;
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
    this.calculateDayColumnWidth();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    // Użyj facade do zmiany miesiąca (facade automatycznie wyczyści state i przeładuje dane)
    this.facade.changeMonth(direction);
    this.facade.loadWorkingDays();

    // Przeładuj dane tabeli po zmianie
    this.prepareTableData();
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

    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    // Ctrl/Cmd + Click = toggle pojedynczej komórki
    if (event.ctrlKey || event.metaKey) {
      const current = new Set(this.selectedCells());

      if (current.has(cellKey)) {
        current.delete(cellKey);
      } else {
        current.add(cellKey);
      }

      this.facade.setSelectedCells(current);
      this.lastClickedCell.set({ employeeId: employee.id, date: dateString });
      return;
    }

    // Shift + Click = zaznacz zakres (tylko w ramach jednego pracownika)
    if (event.shiftKey) {
      const lastClicked = this.lastClickedCell();

      if (lastClicked && lastClicked.employeeId === employee.id) {
        // Oblicz zakres dat
        const lastDate = new Date(lastClicked.date);
        const currentClickDate = new Date(dateString);

        const startDate = lastDate < currentClickDate ? lastDate : currentClickDate;
        const endDate = lastDate < currentClickDate ? currentClickDate : lastDate;

        // Zaznacz wszystkie komórki w zakresie
        const current = new Set(this.selectedCells());
        const tempDate = new Date(startDate);

        while (tempDate <= endDate) {
          const tempDateString = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
          const tempKey = `${employee.id}-${tempDateString}`;
          current.add(tempKey);
          tempDate.setDate(tempDate.getDate() + 1);
        }

        this.facade.setSelectedCells(current);
        return;
      }
    }

    // Zwykłe kliknięcie = wyczyść zaznaczenie i zaznacz tylko tę komórkę
    const newSelection = new Set([cellKey]);
    this.facade.setSelectedCells(newSelection);
    this.lastClickedCell.set({ employeeId: employee.id, date: dateString });
  }

  onDbCellClick(employee: EmployeeRow, dayNumber: number, event: MouseEvent) {
    // Zamknij poprzedni overlay jeśli istnieje
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    // Sprawdź czy kliknięta komórka jest w zaznaczeniu
    const selectedCells = this.selectedCells();
    const isClickedCellSelected = selectedCells.has(cellKey);

    // ZMIANA: Jeśli NIE ma Shift/Ctrl i komórka nie jest zaznaczona, reset
    if (!isClickedCellSelected && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      const newSelection = new Set([cellKey]);
      this.facade.setSelectedCells(newSelection);
    }

    // Teraz pracujemy z aktualnym zaznaczeniem (może być 1 lub więcej komórek)
    const currentSelection = this.selectedCells();
    const currentLocationId = this.selectedLocationId();

    // Przygotuj dane dla wszystkich zaznaczonych komórek
    const selectedCellsData = Array.from(currentSelection).map(key => {
      // Klucz to "employeeId-YYYY-MM-DD"
      // employeeId to UUID (36 znaków), np. "550e8400-e29b-41d4-a716-446655440000"
      const empId = key.substring(0, 36); // Pierwsze 36 znaków to UUID
      const date = key.substring(37); // Reszta po myślniku to data "YYYY-MM-DD"

      const workHoursObject: WorkHours | undefined = this.workHours().find(wh =>
        wh.employee === empId &&
        wh.date === date &&
        wh.location === currentLocationId
      );

      const emp = this.dataSource.find(e => e.id === empId);

      return {
        employee: emp,
        workHours: workHoursObject || null,
        date: date,
        location: currentLocationId
      };
    });

    // Filtruj komórki - zostaw tylko te z prawidłowym employee
    const validCellsData = selectedCellsData.filter(cell => cell.employee !== undefined);

    if (validCellsData.length === 0) {
      console.error('Brak prawidłowych komórek do edycji');
      return;
    }

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

    // Przekaż PIERWSZĄ zaznaczoną komórkę (dla kompatybilności z obecnym komponentem)
    componentRef.setInput('selectedCell', validCellsData[0]);
    componentRef.setInput('selectedCellsCount', validCellsData.length);

    // Obsłuż eventy z komponentu
    componentRef.instance.save.subscribe((data) => {
      this.onPopupSaveMultiple(data, validCellsData);
    });

    componentRef.instance.cancel.subscribe(() => {
      this.onPopupCancel();
    });

    componentRef.instance.delete.subscribe((data) => {
      this.onPopupDeleteMultiple(validCellsData);
    });

    // Zaktualizuj sygnał
    this.selectedCell.set(validCellsData[0]);
  }

  private onPopupCancel() {
    this.closePopup();
  }

  private onPopupSaveMultiple(data: { hours: string; employee: string; date: string; id?: string }, selectedCellsData: any[]) {
    // Zapisz te same godziny dla wszystkich zaznaczonych komórek
    const saveOperations = selectedCellsData.map(cellData => {
      const existingWorkHours = cellData.workHours;

      if (existingWorkHours?.id) {
        // Update istniejących godzin
        return this.facade.updateWorkHours(existingWorkHours.id, {
          hours: data.hours,
          employee: cellData.employee.id,
          date: cellData.date,
          location: this.selectedLocationId()
        });
      } else {
        // Dodaj nowe godziny
        return this.facade.addWorkHours({
          hours: data.hours,
          employee: cellData.employee.id,
          date: cellData.date,
          location: this.selectedLocationId()
        });
      }
    });

    // Wykonaj wszystkie operacje równolegle
    Promise.all(saveOperations.map(obs => obs.toPromise()))
      .then(() => {
        this.facade.emitScheduleUpdate({ multiple: true });
        this.closePopup();
      })
      .catch((error) => {
        console.error('Błąd podczas zapisu wielu komórek:', error);
      });
  }

  private onPopupDeleteMultiple(selectedCellsData: any[]) {
    // Usuń tylko te komórki, które mają workHours
    const deleteOperations = selectedCellsData
      .filter(cellData => cellData.workHours?.id)
      .map(cellData =>
        this.facade.deleteWorkHours(cellData.workHours.id)
      );

    if (deleteOperations.length === 0) {
      this.closePopup();
      return;
    }

    // Wykonaj wszystkie operacje równolegle
    Promise.all(deleteOperations.map(obs => obs.toPromise()))
      .then(() => {
        this.facade.emitScheduleUpdate({ multiple: true, deleted: true });
        this.closePopup();
      })
      .catch((error) => {
        console.error('Błąd podczas usuwania wielu komórek:', error);
      });
  }

  private closePopup() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
    this.selectedCell.set(undefined);
    // Wyczyść zaznaczenie po zamknięciu popupu
    this.facade.clearSelectedCells();
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

  isCellSelected(employee: EmployeeRow, dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    return this.selectedCells().has(cellKey);
  }

  // Sprawdź czy komórka należy do złego tygodnia
  isCellInBadWeek(employee: EmployeeRow, dayNumber: number): boolean {
    const weekNumber = this.getWeekNumber(dayNumber);
    const employeeBadWeeks = this.badWeeks().get(employee.id.toString());
    return employeeBadWeeks ? employeeBadWeeks.has(weekNumber) : false;
  }

  isCellExceeding12h(employee: EmployeeRow, dayNumber: number): boolean {
    const currentDate = this.currentMonthDate();
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const cellKey = `${employee.id}-${dateString}`;

    return this.exceedingWorkHours().has(cellKey);
  }

  private showNotification(error: {type: string, message: string}): void {
    // Sprawdź ile dialogów jest już otwartych
    const openDialogs = this.dialog.openDialogs.length;

    console.log("Powiadomienie wywolane");

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
    if (!locationId) return;

    // Użyj facade do zmiany lokacji (facade automatycznie wyczyści state i przeładuje dane)
    this.facade.changeLocation(locationId);

    // Wyczyść UI state
    this.clearTableState();

    // Przeładuj dane tabeli po zmianie
    this.prepareTableData();
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

  private setupSubscriptions(): void {
    console.log("Zostalem wywolany");
    this.facade.scheduleUpdated$.pipe(takeUntil(this.subscriptions)).subscribe((updatedData) => {
      // Przeładuj dane schedule przez facade
      this.facade.loadScheduleData();

      // Przeładuj tabelę
      timer(300).subscribe(() => {
        this.prepareTableData();

        // Pokaż powiadomienia o konfliktach
        if (updatedData.conflicts) {
          this.showConflictNotifications(updatedData.conflicts, updatedData.employee, updatedData.date);
        }
      });

      this.selectedCell.set(undefined);
    });
  }

  /**
   * Pokazuje powiadomienia o konfliktach TYLKO dla konkretnej komórki
   */
  private showConflictNotifications(
    conflicts: ConflictData,
    employeeId?: string,
    date?: string
  ): void {
    if (!conflicts) return;

    // Jeśli nie ma employeeId/date (np. przy multiple edit) - nie pokazuj powiadomień
    if (!employeeId || !date) {
      console.log('⏭️ Pomijam powiadomienia - brak employeeId lub date');
      return;
    }

    // Stwórz klucz dla edytowanej komórki
    const cellKey = `${employeeId}-${date}`;

    console.log('🔍 Sprawdzam konflikty dla:', cellKey);

    // Sprawdź czy WŁAŚNIE TA komórka ma konflikty
    const hasExceeding12h = (conflicts.exceed_12h || []).includes(cellKey);
    const hasConflict11h = (conflicts.rest_11h || []).includes(cellKey);

    // Dla 35h musimy sprawdzić czy employeeId jest w bad weeks i obliczyć tydzień
    const dayNumber = new Date(date).getDate();
    const weekNumber = Math.ceil(dayNumber / 7);
    const employeeBadWeeks = conflicts.rest_35h?.[employeeId];
    const hasBadWeek35h = employeeBadWeeks ? employeeBadWeeks.includes(weekNumber) : false;

    console.log('📊 Konflikty dla komórki:', {
      cellKey,
      hasExceeding12h,
      hasConflict11h,
      hasBadWeek35h,
      weekNumber,
      employeeBadWeeks
    });

    // Pokaż powiadomienia TYLKO jeśli ta konkretna komórka ma problem
    if (hasExceeding12h) {
      this.showNotification({
        type: 'exceed12h',
        message: 'Uwzględnij odbiór nadgodzin dla pracownika.'
      });
    }

    if (hasConflict11h) {
      this.showNotification({
        type: 'conflict11h',
        message: 'Brak przerwy 11h u pracownika'
      });
    }

    if (hasBadWeek35h) {
      this.showNotification({
        type: 'badWeek35h',
        message: 'Brak przerwy 35h w tygodniu'
      });
    }

    // Jeśli nie ma konfliktów dla tej komórki
    if (!hasExceeding12h && !hasConflict11h && !hasBadWeek35h) {
      console.log('✅ Brak konfliktów dla tej komórki');
    }
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

  testPdf() {
    this.facade.downloadSchedulePdf();
  }

  testAttendance() {
    this.facade.downloadAttendanceSheets();
  }

  // TrackBy functions for performance optimization
  trackByEmployeeId(index: number, employee: EmployeeRow): string {
    return employee.id;
  }
}
