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

  generateSchedulePdf(locationId: string, month: number, year: number) {
    // Zbuduj URL z parametrami
    const params = `?location=${locationId}&month=${month}&year=${year}`;

    return this.http.get(`${this.apiUrl}work-hours/generate-schedule-pdf/${params}`, {
      responseType: 'blob'
    }).pipe(
      tap(blob => {
        // Utwórz URL do pobrania pliku
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grafik_${month}_${year}_lokacja_${locationId}.pdf`;
        link.click();

        // Zwolnij pamięć
        window.URL.revokeObjectURL(url);
      })
    );
  }

  generateAttendanceSheets(locationId: string, month: number, year: number) {
    // Zbuduj URL z parametrami
    const params = `?location=${locationId}&month=${month}&year=${year}`;

    return this.http.get(`${this.apiUrl}work-hours/generate-attendance-sheets/${params}`, {
      responseType: 'blob'
    }).pipe(
      tap(blob => {
        // Utwórz URL do pobrania pliku
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grafik_${month}_${year}_lokacja_${locationId}.pdf`;
        link.click();

        // Zwolnij pamięć
        window.URL.revokeObjectURL(url);
      })
    );
  }

}
