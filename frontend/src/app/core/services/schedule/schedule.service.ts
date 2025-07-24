import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ValidationResult {
  type: 'exceed12h' | 'conflict11h' | 'badWeek35h';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = environment.apiUrl + 'schedule/';

  private scheduleUpdatedSubject = new Subject<any>();
  public scheduleUpdated$ = this.scheduleUpdatedSubject.asObservable();

  constructor(private http: HttpClient) { }

  getWorkHours(filters?: any): Observable<any[]> {
    let url = `${this.apiUrl}work-hours/`;
    if(filters){
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.employee_id) params.append('employee_id', filters.employee_id);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get<any[]>(url);
  }

  addWorkHours(workHours: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}work-hours/`, workHours);
  }

  updateWorkHours(id: string, workHours: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}work-hours/${id}/`, workHours);
  }

  deleteWorkHours(id: number): Observable<any> {
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

  validateRestTimeConflicts(
    employees: any[],
    workHours: any[],
    getAdjacentDaysHours: (employeeId: number, date: string) => { previousDay: string | null, nextDay: string | null }
  ): Set<string> {
    const conflicts = new Set<string>();

    employees.forEach(employee => {
      const employeeWorkHours = workHours.filter(wh => wh.employee === employee.id);

      employeeWorkHours.forEach(currentWorkHour => {
        const adjacentHours = getAdjacentDaysHours(employee.id, currentWorkHour.date);

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

    return conflicts;
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

  validate35HourRestInAllWeeks(
    employees: any[],
    workHours: any[],
    currentMonthDate: Date
  ): Map<string, Set<number>> {
    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    const numberOfWeeks = Math.ceil(daysInMonth / 7);
    const badWeeksMap = new Map<string, Set<number>>();

    employees.forEach(employee => {
      const employeeShifts = workHours
        .filter(wh => wh.employee === employee.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const employeeBadWeeks = new Set<number>();

      // Sprawdź każdy tydzień osobno
      for (let week = 1; week <= numberOfWeeks; week++) {
        const weekStart = (week - 1) * 7 + 1;
        const weekEnd = Math.min(week * 7, daysInMonth);

        // Pobierz zmiany z tego tygodnia
        const weekShifts = employeeShifts.filter(shift => {
          const day = new Date(shift.date).getDate();
          return day >= weekStart && day <= weekEnd;
        });

        // Oblicz wszystkie przerwy w tygodniu
        const restPeriods = this.calculateAllRestPeriodsInWeek(weekShifts, weekStart, weekEnd, currentMonthDate);

        // Sprawdź czy jest przynajmniej jedna przerwa >= 35h
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

  private calculateAllRestPeriodsInWeek(
    weekShifts: any[],
    weekStart: number,
    weekEnd: number,
    currentMonthDate: Date
  ): Array<{hours: number, description: string}> {
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
    const weekStartDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), weekStart, 0, 0, 0);
    const weekEndDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), weekEnd, 23, 59, 59);

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

}
