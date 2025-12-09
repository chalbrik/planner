import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Importuj TWOJE store'y
import { ScheduleStore } from '../../store/schedule.store';
import { EmployeesStore } from '../../store/employees.store';
import { LocationsStore } from '../../store/locations.store';

// Importuj serwisy API
import { ScheduleService, WorkHoursResponse, WorkHoursWithConflicts, ConflictData } from './schedule.service';
import { EmployeesService } from '../employees/employees.service';
import { LocationService } from '../locations/location.service';
import { HolidayService } from '../holiday/holiday.service';

import { WorkHours } from './schedule.types';
import { Employee } from '../employees/employee.types';
import { Location } from '../locations/location.types';

@Injectable({
  providedIn: 'root'
})
export class ScheduleFacade {
  // ============================================
  // INJECT STORES (zamiast własnych sygnałów!)
  // ============================================
  private readonly scheduleStore = inject(ScheduleStore);
  private readonly employeesStore = inject(EmployeesStore);
  private readonly locationsStore = inject(LocationsStore);

  // Inject API services
  private readonly scheduleApi = inject(ScheduleService);
  private readonly employeesApi = inject(EmployeesService);
  private readonly locationsApi = inject(LocationService);
  private readonly holidayApi = inject(HolidayService);

  // ============================================
  // PUBLIC SIGNALS (deleguj ze store'ów!)
  // ============================================

  // Z EmployeesStore
  public readonly employees = this.employeesStore.employees;

  // Z LocationsStore
  public readonly locations = this.locationsStore.locations;
  public readonly locationOptions = this.locationsStore.locationOptions;
  public readonly selectedLocationId = this.locationsStore.selectedLocationId;

  // Z ScheduleStore
  public readonly workHours = this.scheduleStore.workHours;
  public readonly conflicts = this.scheduleStore.conflicts;
  public readonly currentMonthDate = this.scheduleStore.currentDate;
  public readonly currentMonth = this.scheduleStore.currentMonth;
  public readonly currentYear = this.scheduleStore.currentYear;
  public readonly selectedCells = this.scheduleStore.selectedCellIds;


  // Loading/Error - możesz wybrać z którego store'a
  public readonly isLoading = this.scheduleStore.isLoading;
  public readonly error = this.scheduleStore.error;

  // Computed signals dla konfliktów
  public readonly conflictingCells = computed(() => {
    const conflicts = this.conflicts();
    if (!conflicts) return new Set<string>();

    const cellSet = new Set<string>();
    conflicts.rest_11h?.forEach(key => cellSet.add(key));
    conflicts.exceed_12h?.forEach(key => cellSet.add(key));
    return cellSet;
  });

  public readonly badWeeks = computed(() => {
    const conflicts = this.conflicts();
    if (!conflicts || !conflicts.rest_35h) return new Map<string, Set<number>>();

    const badWeeksMap = new Map<string, Set<number>>();
    Object.entries(conflicts.rest_35h).forEach(([empId, weeks]) => {
      badWeeksMap.set(empId, new Set(weeks as number[]));
    });
    return badWeeksMap;
  });

  public readonly exceedingWorkHours = computed(() => {
    const conflicts = this.conflicts();
    if (!conflicts || !conflicts.exceed_12h) return new Set<string>();
    return new Set(conflicts.exceed_12h);
  });

  // Working days - lokalny signal (nie ma dedykowanego store'a)
  public readonly workingDaysInMonth = this.scheduleStore.workingDaysInMonth;

  // Observable dla schedule updates
  public readonly scheduleUpdated$ = this.scheduleApi.scheduleUpdated$;

  // ============================================
  // ACTIONS
  // ============================================

  loadLocations(): Observable<Location[]> {
    this.locationsStore.setLoading(true);

    return this.locationsApi.getLocations().pipe(
      tap(locations => {
        this.locationsStore.setLocations(locations);
        this.locationsStore.setLoading(false);

        // Auto-select pierwszej lokacji
        if (locations && locations.length > 0 && !this.selectedLocationId()) {
          this.changeLocation(locations[0].id);
        }
      }),
      catchError(error => {
        console.error('❌ Błąd ładowania lokacji:', error);
        this.locationsStore.setError('Nie udało się załadować lokacji');
        return of([]);
      })
    );
  }

  changeLocation(locationId: string): void {
    if (!locationId) return;

    this.locationsStore.selectLocation(locationId);
    this.scheduleStore.setLocation(locationId);
    this.loadScheduleData();
  }

  changeMonth(direction: number): void {
    this.scheduleStore.changeMonth(direction);
    this.loadScheduleData();
  }

  loadScheduleData(): void {
    const locationId = this.selectedLocationId();
    if (!locationId) return;

    this.scheduleStore.setLoading(true);

    const month = this.currentMonth();
    const year = this.currentYear();

    Promise.all([
      this.loadEmployees(locationId),
      this.loadWorkHours(locationId, month, year)
    ])
      .then(() => {
        this.scheduleStore.setLoading(false);
      })
      .catch(error => {
        console.error('❌ Błąd ładowania danych:', error);
        this.scheduleStore.setError('Nie udało się załadować danych');
      });
  }

  private loadEmployees(locationId: string): Promise<Employee[]> {
    return new Promise((resolve, reject) => {
      const params = { location: locationId };

      this.employeesApi.getEmployees(params).subscribe({
        next: (data) => {
          this.employeesStore.setEmployees(Array.isArray(data) ? data : []);
          resolve(data);
        },
        error: (error) => {
          console.error('❌ Błąd ładowania pracowników:', error);
          this.employeesStore.setEmployees([]);
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
          this.scheduleStore.setWorkHours(response.work_hours || []);
          this.scheduleStore.setConflicts(response.conflicts || null);
          resolve(response.work_hours || []);
        },
        error: (error) => {
          console.error('❌ Błąd ładowania harmonogramu:', error);
          this.scheduleStore.setWorkHours([]);
          this.scheduleStore.setConflicts(null);
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
        this.scheduleStore.setWorkingDays(workingDays); // ← UŻYJ TEGO!
      },
      error: (error) => {
        console.error('❌ Błąd pobierania dni roboczych:', error);
      }
    });
  }

  // CRUD operations
  addWorkHours(data: any): Observable<WorkHoursWithConflicts> {
    return this.scheduleApi.addWorkHours(data);
  }

  updateWorkHours(id: string, data: any): Observable<WorkHoursWithConflicts> {
    return this.scheduleApi.updateWorkHours(id, data);
  }

  deleteWorkHours(id: string): Observable<{ deleted: boolean; conflicts: ConflictData }> {
    return this.scheduleApi.deleteWorkHours(id);
  }

  emitScheduleUpdate(data: any): void {
    this.scheduleApi.emitScheduleUpdate(data);
  }

  // PDF operations
  downloadSchedulePdf(): void {
    const locationId = this.selectedLocationId();
    if (!locationId) return;

    const month = this.currentMonth();
    const year = this.currentYear();

    this.scheduleApi.generateSchedulePdf(locationId, month, year).subscribe({
      error: (error) => console.error('❌ Błąd generowania PDF:', error)
    });
  }

  downloadAttendanceSheets(): void {
    const locationId = this.selectedLocationId();
    if (!locationId) return;

    const month = this.currentMonth();
    const year = this.currentYear();

    this.scheduleApi.generateAttendanceSheets(locationId, month, year).subscribe({
      error: (error) => console.error('❌ Błąd generowania listy:', error)
    });
  }

  // Selection operations
  setSelectedCells(cells: Set<string>): void {
    this.scheduleStore.updateState(state => ({
      ...state,
      selectedCellIds: cells
    }));
  }

  clearSelectedCells(): void {
    this.scheduleStore.clearSelection();
  }
}
