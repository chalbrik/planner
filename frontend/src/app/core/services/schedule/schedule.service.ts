import {inject, Injectable, signal} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {tap} from 'rxjs/operators';
import {WorkHours} from './schedule.types';
import {EmployeesService} from '../employees/employees.service';

interface ValidationResult {
  type: 'exceed12h' | 'conflict11h' | 'badWeek35h';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private static readonly REQUIRED_REST_HOURS = 35;
  private static readonly HOURS_IN_DAY = 24;
  private static readonly DAYS_IN_WEEK = 7;


  http = inject(HttpClient);
  _employeesService = inject(EmployeesService)

  _workHours = signal<WorkHours[]>([])

  private apiUrl = environment.apiUrl + 'schedule/';

  private scheduleUpdatedSubject = new Subject<any>();
  public scheduleUpdated$ = this.scheduleUpdatedSubject.asObservable();

  //zmienna ktora przechowuje parsowane WorkHours
  private parseWorkHoursCache = new Map<string, {startTime: number, endTime: number}>();

  private dayNumberCache = new Map<string, number>();


  constructor() { }

  getWorkHours(filters?: any): Observable<WorkHours[]> {
    return this.http.get<any[]>(`${this.apiUrl}work-hours/`, { params: filters }).pipe(
      tap(responseData => {
        this._workHours.set(responseData)
      })
    );
  }

  addWorkHours(workHours: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}work-hours/`, workHours);
  }

  updateWorkHours(id: string, workHours: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}work-hours/${id}/`, workHours);
  }

  deleteWorkHours(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}work-hours/${id}/`);
  }

  // Metoda do emitowania aktualizacji
  emitScheduleUpdate(data: any) {
    this.scheduleUpdatedSubject.next(data);
  }

  // WALIDACJA PÓL GRAFIKOW ORAZ WYWOLYWANIE KOMUNIKATOW

  validateWorkHoursExceed12h(hoursString: string): ValidationResult | null {
    if (!hoursString) return null;

    const shift = this.parseWorkHours(hoursString);
    if (!shift) return null;

    const shiftLengthMinutes = shift.endTime - shift.startTime;
    const shiftLengthHours = shiftLengthMinutes / 60;

    if (shiftLengthHours > 12) {
      return {
        type: 'exceed12h',
        message: 'Uwzględnij odbior nadgodzin dla pracownika.'
      };
    }

    return null;
  }

  parseWorkHours(hoursString: string): { startTime: number, endTime: number } | null {
    const match = hoursString.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);

    if (!match) return null;

    const [, startHour, startMin, endHour, endMin] = match;

    return {
      startTime: parseInt(startHour) * 60 + parseInt(startMin), // minuty od północy
      endTime: parseInt(endHour) * 60 + parseInt(endMin)
    };
  }

  validateRestTimeConflicts(): Set<string> {
    const conflicts = new Set<string>();
    const employees = this._employeesService.employees();
    const workHours = this._workHours();

    // ✅ Nie mutuj oryginalnych danych
    const sortedWorkHours = [...workHours].sort((a, b) => a.date.localeCompare(b.date));

    const workHoursByEmployee = new Map<string, WorkHours[]>();

    sortedWorkHours.forEach(wh => {
      if (!workHoursByEmployee.has(wh.employee)) {
        workHoursByEmployee.set(wh.employee, []);
      }
      workHoursByEmployee.get(wh.employee)!.push(wh);
    });

    employees.forEach(employee => {
      const employeeWorkHours = workHoursByEmployee.get(employee.id) || [];

      for (let i = 0; i < employeeWorkHours.length - 1; i++) {
        const currentDay = employeeWorkHours[i];
        const nextDay = employeeWorkHours[i + 1];

        // ✅ POPRAWKA: Przekaż całe obiekty zamiast tylko stringów godzin
        const restTime = this.calculateRestBetween(currentDay, nextDay);

        if (restTime < 11) {
          conflicts.add(`${employee.id}-${currentDay.date}`);
          conflicts.add(`${employee.id}-${nextDay.date}`);
        }
      }
    });

    return conflicts;
  }

  private calculateRestBetween(currentDay: any, nextDay: any): number {
    const currentShift = this.parseWorkHoursCached(currentDay.hours);
    const nextShift = this.parseWorkHoursCached(nextDay.hours);

    if (!currentShift || !nextShift) return 24;

    // ✅ Oblicz pełne daty z godzinami
    const currentDate = new Date(currentDay.date);
    const nextDate = new Date(nextDay.date);

    // Ustaw końcową godzinę obecnej zmiany
    const currentEndTime = new Date(currentDate);
    currentEndTime.setHours(
      Math.floor(currentShift.endTime / 60),
      currentShift.endTime % 60,
      0,
      0
    );

    // Ustaw początkową godzinę następnej zmiany
    const nextStartTime = new Date(nextDate);
    nextStartTime.setHours(
      Math.floor(nextShift.startTime / 60),
      nextShift.startTime % 60,
      0,
      0
    );

    // ✅ Oblicz różnicę w godzinach uwzględniając pełne dni
    const restHours = (nextStartTime.getTime() - currentEndTime.getTime()) / (1000 * 60 * 60);

    return Math.max(0, restHours);
  }

  private parseWorkHoursCached(hoursString: string): { startTime: number, endTime: number } | null {
    // ✅ Sprawdź cache najpierw
    if (this.parseWorkHoursCache.has(hoursString)) {
      return this.parseWorkHoursCache.get(hoursString)!;
    }

    // ✅ Jeśli nie ma w cache - parsuj i zapisz
    const parsed = this.parseWorkHours(hoursString);
    if (parsed) {
      this.parseWorkHoursCache.set(hoursString, parsed);
    }

    return parsed;
  }

  validate35HourRestInAllWeeks(currentMonthDate: Date): Map<string, Set<number>> {
    const employees = this._employeesService.employees();
    const workHours = this._workHours();

    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    const numberOfWeeks = Math.ceil(daysInMonth / 7);

    // Pre-sortowanie i grupowanie
    const sortedWorkHours = [...workHours].sort((a, b) => a.date.localeCompare(b.date));
    const workHoursByEmployee = new Map<string, any[]>();

    sortedWorkHours.forEach(wh => {
      if (!workHoursByEmployee.has(wh.employee)) {
        workHoursByEmployee.set(wh.employee, []);
      }
      workHoursByEmployee.get(wh.employee)!.push(wh);
    });

    const badWeeksMap = new Map<string, Set<number>>();

    employees.forEach(employee => {
      const employeeShifts = workHoursByEmployee.get(employee.id) || [];
      const employeeBadWeeks = new Set<number>();

      // Grupuj zmiany według tygodni
      const shiftsByWeek = new Map<number, any[]>();
      employeeShifts.forEach(shift => {
        const dayNumber = this.getDayNumber(shift.date);
        const weekNumber = Math.ceil(dayNumber / 7);

        if (!shiftsByWeek.has(weekNumber)) {
          shiftsByWeek.set(weekNumber, []);
        }
        shiftsByWeek.get(weekNumber)!.push(shift);
      });

      // Sprawdź każdy tydzień
      for (let week = 1; week <= numberOfWeeks; week++) {
        const weekShifts = shiftsByWeek.get(week) || [];
        const restPeriods = this.calculateAllRestPeriodsInWeek(weekShifts, week, currentMonthDate);
        const hasLongRest = restPeriods.some(rest => rest.hours >= 35);

        if (!hasLongRest) {
          employeeBadWeeks.add(week);
        }
      }

      if (employeeBadWeeks.size > 0) {
        badWeeksMap.set(employee.id, employeeBadWeeks);
      }
    });

    return badWeeksMap;
  }

  private getDayNumber(dateString: string): number {
    if (!this.dayNumberCache.has(dateString)) {
      this.dayNumberCache.set(dateString, new Date(dateString).getDate());
    }
    return this.dayNumberCache.get(dateString)!;
  }

  private calculateAllRestPeriodsInWeek(
    weekShifts: any[],
    weekNumber: number,
    currentMonthDate: Date
  ): Array<{hours: number}> {

    if (weekShifts.length === 0) {
      return [{hours: 168}];
    }

    const restPeriods: Array<{hours: number}> = [];
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    // Oblicz granice tygodnia
    const weekStart = (weekNumber - 1) * 7 + 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekEnd = Math.min(weekNumber * 7, daysInMonth);


    // ✅ 1. Przerwa od początku tygodnia do pierwszej zmiany
    const firstShift = weekShifts[0];
    const firstShiftDay = new Date(firstShift.date).getDate();
    const firstShiftStart = this.parseShiftStartTime(firstShift, year, month);

    if (firstShiftDay > weekStart) {
      // Całe dni przed pierwszą zmianą
      const fullDaysBefore = firstShiftDay - weekStart;
      const hoursFromFullDays = fullDaysBefore * 24;
      restPeriods.push({hours: hoursFromFullDays});
    }

    if (firstShiftDay === weekStart && firstShiftStart) {
      // Godziny od początku dnia do pierwszej zmiany
      const startOfDay = new Date(year, month, firstShiftDay, 0, 0, 0);
      const hoursFromDayStart = (firstShiftStart.getTime() - startOfDay.getTime()) / (1000 * 60 * 60);
      if (hoursFromDayStart > 0) {
        restPeriods.push({hours: hoursFromDayStart});
      }
    }

    // ✅ 2. Przerwy między zmianami (istniejący kod)
    for (let i = 0; i < weekShifts.length - 1; i++) {
      const currentEnd = this.parseShiftEndTime(weekShifts[i], year, month);
      const nextStart = this.parseShiftStartTime(weekShifts[i + 1], year, month);

      if (currentEnd && nextStart) {
        const restHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

        if (restHours > 0) {
          restPeriods.push({hours: restHours});
        }
      }
    }

    // ✅ 3. Przerwa od ostatniej zmiany do końca tygodnia
    const lastShift = weekShifts[weekShifts.length - 1];
    const lastShiftDay = new Date(lastShift.date).getDate();
    const lastShiftEnd = this.parseShiftEndTime(lastShift, year, month);

    if (lastShiftDay < weekEnd) {
      // Całe dni po ostatniej zmianie
      const fullDaysAfter = weekEnd - lastShiftDay;
      const hoursFromFullDays = fullDaysAfter * 24;
      restPeriods.push({hours: hoursFromFullDays});
    }

    if (lastShiftDay === weekEnd && lastShiftEnd) {
      // Godziny od ostatniej zmiany do końca dnia
      const endOfDay = new Date(year, month, lastShiftDay, 23, 59, 59);
      const hoursToEndOfDay = (endOfDay.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60);
      if (hoursToEndOfDay > 0) {
        restPeriods.push({hours: hoursToEndOfDay});
      }
    }

    return restPeriods;
  }

  private parseShiftStartTime(shift: any, year: number, month: number): Date | null {
    const match = shift.hours.match(/(\d{1,2}):(\d{2})-/);
    if (!match) return null;

    const date = new Date(year, month, new Date(shift.date).getDate());
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    return date;
  }

  private parseShiftEndTime(shift: any, year: number, month: number): Date | null {
    const match = shift.hours.match(/-(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const date = new Date(year, month, new Date(shift.date).getDate());
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    return date;
  }
}
