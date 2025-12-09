import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { ScheduleService, WorkHoursResponse, WorkHoursWithConflicts, ConflictData } from './schedule.service';
import { EmployeesService } from '../employees/employees.service';
import { LocationService } from '../locations/location.service';
import { HolidayService } from '../holiday/holiday.service';

import { WorkHours } from './schedule.types';
import { Employee } from '../employees/employee.types';
import { Location } from '../locations/location.types';

/**
 * ScheduleFacade - Warstwa orkiestracji dla modułu Schedule
 * Centralizuje logikę biznesową i koordynuje między serwisami
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleFacade {
  private readonly scheduleApi = inject(ScheduleService);
  private readonly employeesApi = inject(EmployeesService);
  private readonly locationsApi = inject(LocationService);
  private readonly holidayApi = inject(HolidayService);

  // ============================================
  // STATE SIGNALS
  // ============================================

  // Dane
  private readonly _employees = signal<Employee[]>([]);
  private readonly _workHours = signal<WorkHours[]>([]);
  private readonly _locations = signal<Location[]>([]);
  private readonly _conflicts = signal<ConflictData | null>(null);

  // UI State
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentMonthDate = signal<Date>(new Date());
  private readonly _selectedLocationId = signal<string>('');
  private readonly _workingDaysInMonth = signal<number>(0);

  // Selection
  private readonly _selectedCells = signal<Set<string>>(new Set());

  // ============================================
  // PUBLIC READ-ONLY SIGNALS
  // ============================================

  public readonly employees = this._employees.asReadonly();
  public readonly workHours = this._workHours.asReadonly();
  public readonly locations = this._locations.asReadonly();
  public readonly conflicts = this._conflicts.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentMonthDate = this._currentMonthDate.asReadonly();
  public readonly selectedLocationId = this._selectedLocationId.asReadonly();
  public readonly workingDaysInMonth = this._workingDaysInMonth.asReadonly();
  public readonly selectedCells = this._selectedCells.asReadonly();

  // ============================================
  // COMPUTED SIGNALS
  // ============================================

  public readonly locationOptions = computed(() =>
    this._locations().map(loc => ({
      value: loc.id,
      label: loc.name
    }))
  );

  public readonly currentMonth = computed(() => this._currentMonthDate().getMonth() + 1);
  public readonly currentYear = computed(() => this._currentMonthDate().getFullYear());

  // Konflikty jako Set dla łatwego sprawdzania
  public readonly conflictingCells = computed(() => {
    const conflicts = this._conflicts();
    if (!conflicts) return new Set<string>();

    const cellSet = new Set<string>();
    conflicts.rest_11h?.forEach(key => cellSet.add(key));
    conflicts.exceed_12h?.forEach(key => cellSet.add(key));
    return cellSet;
  });

  public readonly badWeeks = computed(() => {
    const conflicts = this._conflicts();
    if (!conflicts || !conflicts.rest_35h) return new Map<string, Set<number>>();

    const badWeeksMap = new Map<string, Set<number>>();
    Object.entries(conflicts.rest_35h).forEach(([empId, weeks]) => {
      badWeeksMap.set(empId, new Set(weeks as number[]));
    });
    return badWeeksMap;
  });

  public readonly exceedingWorkHours = computed(() => {
    const conflicts = this._conflicts();
    if (!conflicts || !conflicts.exceed_12h) return new Set<string>();
    return new Set(conflicts.exceed_12h);
  });

  // Observable dla schedule updates (kompatybilność wsteczna)
  public readonly scheduleUpdated$ = this.scheduleApi.scheduleUpdated$;

  // ============================================
  // ACTIONS - Locations
  // ============================================

  loadLocations(): Observable<Location[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.locationsApi.getLocations().pipe(
      tap(locations => {
        this._locations.set(locations);

        // Auto-select pierwszej lokacji jeśli jest dostępna
        if (locations && locations.length > 0 && !this._selectedLocationId()) {
          this.changeLocation(locations[0].id);
        }
      }),
      catchError(error => {
        console.error('❌ Błąd ładowania lokacji:', error);
        this._error.set('Nie udało się załadować lokacji');
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  changeLocation(locationId: string): void {
    if (!locationId) return;

    this._selectedLocationId.set(locationId);
    this.clearState();
    this.loadScheduleData();
  }

  // ============================================
  // ACTIONS - Calendar
  // ============================================

  changeMonth(direction: number): void {
    const current = this._currentMonthDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + direction, 1);

    this._currentMonthDate.set(newDate);
    this.clearState();
    this.loadScheduleData();
    this.loadWorkingDays();
  }

  // ============================================
  // ACTIONS - Data Loading
  // ============================================

  loadScheduleData(): void {
    const locationId = this._selectedLocationId();
    if (!locationId) {
      console.warn('Brak wybranej lokacji');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    const month = this.currentMonth();
    const year = this.currentYear();

    // Załaduj employees i work hours równolegle
    Promise.all([
      this.loadEmployees(locationId),
      this.loadWorkHours(locationId, month, year)
    ])
      .then(() => {
        this._isLoading.set(false);
      })
      .catch(error => {
        console.error('❌ Błąd ładowania danych:', error);
        this._error.set('Nie udało się załadować danych');
        this._isLoading.set(false);
      });
  }

  private loadEmployees(locationId: string): Promise<Employee[]> {
    return new Promise((resolve, reject) => {
      const params = { location: locationId };

      this.employeesApi.getEmployees(params).subscribe({
        next: (data) => {
          this._employees.set(Array.isArray(data) ? data : []);
          resolve(data);
        },
        error: (error) => {
          console.error('❌ Błąd ładowania pracowników:', error);
          this._employees.set([]);
          reject(error);
        }
      });
    });
  }

  private loadWorkHours(locationId: string, month: number, year: number): Promise<WorkHours[]> {
    return new Promise((resolve, reject) => {
      const filters = { month, year, location: locationId };

      this.scheduleApi.getWorkHours(filters).subscribe({
        next: (response: WorkHoursResponse) => {
          this._workHours.set(response.work_hours || []);
          this._conflicts.set(response.conflicts || null);
          resolve(response.work_hours || []);
        },
        error: (error) => {
          console.error('❌ Błąd ładowania harmonogramu:', error);
          this._workHours.set([]);
          this._conflicts.set(null);
          reject(error);
        }
      });
    });
  }

  loadWorkingDays(): void {
    const month = this.currentMonth();
    const year = this.currentYear();

    this.holidayApi.calculateWorkingDaysInMonth(year, month).subscribe({
      next: (workingDays) => {
        this._workingDaysInMonth.set(workingDays);
      },
      error: (error) => {
        console.error('❌ Błąd pobierania dni roboczych:', error);
        // Fallback - oblicz bez świąt
        const fallbackDays = this.calculateWorkingDaysWithoutHolidays();
        this._workingDaysInMonth.set(fallbackDays);
      }
    });
  }

  private calculateWorkingDaysWithoutHolidays(): number {
    const currentDate = this._currentMonthDate();
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

  // ============================================
  // ACTIONS - Work Hours CRUD
  // ============================================

  addWorkHours(data: {
    hours: string;
    employee: string;
    date: string;
    location: string;
  }): Observable<WorkHoursWithConflicts> {
    return this.scheduleApi.addWorkHours(data);
  }

  updateWorkHours(id: string, data: {
    hours: string;
    employee: string;
    date: string;
    location: string;
  }): Observable<WorkHoursWithConflicts> {
    return this.scheduleApi.updateWorkHours(id, data);
  }

  deleteWorkHours(id: string): Observable<{ deleted: boolean; conflicts: ConflictData }> {
    return this.scheduleApi.deleteWorkHours(id);
  }

  emitScheduleUpdate(data: any): void {
    this.scheduleApi.emitScheduleUpdate(data);
  }

  // ============================================
  // ACTIONS - PDF Generation
  // ============================================

  downloadSchedulePdf(): void {
    const locationId = this._selectedLocationId();
    if (!locationId) {
      console.error('Brak wybranej lokacji');
      return;
    }

    const month = this.currentMonth();
    const year = this.currentYear();

    this.scheduleApi.generateSchedulePdf(locationId, month, year).subscribe({
      next: () => {
        console.log('✅ PDF wygenerowany pomyślnie');
      },
      error: (error) => {
        console.error('❌ Błąd generowania PDF:', error);
        this._error.set('Nie udało się wygenerować PDF');
      }
    });
  }

  downloadAttendanceSheets(): void {
    const locationId = this._selectedLocationId();
    if (!locationId) {
      console.error('Brak wybranej lokacji');
      return;
    }

    const month = this.currentMonth();
    const year = this.currentYear();

    this.scheduleApi.generateAttendanceSheets(locationId, month, year).subscribe({
      next: () => {
        console.log('✅ Lista obecności wygenerowana pomyślnie');
      },
      error: (error) => {
        console.error('❌ Błąd generowania listy obecności:', error);
        this._error.set('Nie udało się wygenerować listy obecności');
      }
    });
  }

  // ============================================
  // ACTIONS - Selection
  // ============================================

  setSelectedCells(cells: Set<string>): void {
    this._selectedCells.set(cells);
  }

  clearSelectedCells(): void {
    this._selectedCells.set(new Set());
  }

  // ============================================
  // HELPERS
  // ============================================

  private clearState(): void {
    this._workHours.set([]);
    this._employees.set([]);
    this._conflicts.set(null);
    this._selectedCells.set(new Set());
    this._error.set(null);
  }
}
