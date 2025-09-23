import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {Holiday, MonthHolidaysResponse} from './holiday.types';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'holidays';

  private _currentMonthHolidays = signal<Holiday[]>([]);

  constructor() { }

  public currentMonthHolidays = this._currentMonthHolidays.asReadonly();

  /**
   * Pobiera święta dla konkretnego miesiąca
   * @param year Rok (np. 2025)
   * @param month Miesiąc (1-12)
   */
  getHolidaysForMonth(year: number, month: number): Observable<MonthHolidaysResponse> {
    return this.http.get<MonthHolidaysResponse>(`${this.apiUrl}/${year}/${month}/`).pipe(
      tap(response => {
        this._currentMonthHolidays.set(response.holidays);
      })
    );
  }

  /**
   * Sprawdza czy konkretna data jest świętem
   * @param date Data w formacie YYYY-MM-DD
   */
  isHoliday(date: string): boolean {
    const holidays = this._currentMonthHolidays();
    return holidays.some(holiday => holiday.date === date);
  }

  /**
   * Pobiera nazwy świąt dla konkretnej daty
   * @param date Data w formacie YYYY-MM-DD
   */
  getHolidayName(date: string): string | null {
    const holidays = this._currentMonthHolidays();
    const holiday = holidays.find(h => h.date === date);
    return holiday ? holiday.localName : null;
  }

  /**
   * Oblicza liczbę dni roboczych w miesiącu
   * Odejmuje weekendy i święta (ale nie święta przypadające w niedziele)
   * @param year Rok (np. 2025)
   * @param month Miesiąc (1-12)
   */
  calculateWorkingDaysInMonth(year: number, month: number): Observable<number> {
    return this.getHolidaysForMonth(year, month).pipe(
      tap(response => {
        const workingDays = this.countWorkingDays(year, month, response.holidays);
        console.log(`📊 Dni robocze w ${month}/${year}: ${workingDays}`);
      }),
      // Zwracamy tylko liczbę dni roboczych
      tap(() => {}),
      // Mapujemy na liczbę
      map(response => this.countWorkingDays(year, month, response.holidays))
    );
  }

  private countWorkingDays(year: number, month: number, holidays: Holiday[]): number {
    // Pobierz liczbę dni w miesiącu
    const daysInMonth = new Date(year, month, 0).getDate();

    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay(); // 0=niedziela, 6=sobota

      // Pomiń weekendy
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Sprawdź czy to święto
      const dateString = this.formatDateToString(year, month, day);
      const isHoliday = holidays.some(holiday => holiday.date === dateString);

      // Jeśli to święto przypadające w dzień roboczy, odejmij
      if (isHoliday) {
        console.log(`🎭 Święto w dzień roboczy: ${dateString}`);
        continue;
      }

      // To jest dzień roboczy
      workingDays++;
    }

    return workingDays;
  }

  private formatDateToString(year: number, month: number, day: number): string {
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  /**
   * Czyści cache świąt (przydatne przy zmianie miesiąca)
   */
  clearHolidays(): void {
    this._currentMonthHolidays.set([]);
  }
}
