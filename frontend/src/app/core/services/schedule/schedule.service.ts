// core/services/schedule/schedule.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WorkHours } from './schedule.types';
import { environment } from '../../../../environments/environment';

// ✅ NOWY TYP - response z backendu
export interface WorkHoursResponse {
  work_hours: WorkHours[];
  conflicts: ConflictData | null;
}

export interface ConflictData {
  rest_11h: string[];  // ["employee-id-YYYY-MM-DD", ...]
  rest_35h: { [employeeId: string]: number[] };  // {"employee-id": [1, 3], ...}
  exceed_12h: string[];  // ["employee-id-YYYY-MM-DD", ...]
}

export interface WorkHoursWithConflicts extends WorkHours {
  conflicts?: ConflictData;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'schedule'; // ← Bez slasha na końcu (jak w employees)

  // Subject do komunikacji o zmianach
  private scheduleUpdatedSubject = new Subject<WorkHoursWithConflicts>();
  public scheduleUpdated$ = this.scheduleUpdatedSubject.asObservable();

  /**
   * Pobiera godziny pracy z filtrami
   * Zwraca work_hours + conflicts
   */
  getWorkHours(filters?: {
    month?: number;
    year?: number;
    location?: string;
    employee_id?: string;
  }): Observable<WorkHoursResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.month) params = params.set('month', filters.month.toString());
      if (filters.year) params = params.set('year', filters.year.toString());
      if (filters.location) params = params.set('location', filters.location);
      if (filters.employee_id) params = params.set('employee_id', filters.employee_id);
    }

    return this.http.get<WorkHoursResponse>(`${this.apiUrl}/`, { params }); // ← Dodaj /
  }

  /**
   * Dodaje nowe godziny pracy
   * Zwraca zapisane dane + conflicts
   */
  addWorkHours(data: {
    hours: string;
    employee: string;
    date: string;
    location: string;
  }): Observable<WorkHoursWithConflicts> {
    return this.http.post<WorkHoursWithConflicts>(`${this.apiUrl}/`, data).pipe( // ← Dodaj /
      tap((response) => {
        this.scheduleUpdatedSubject.next(response);
      })
    );
  }

  /**
   * Aktualizuje istniejące godziny pracy
   * Zwraca zaktualizowane dane + conflicts
   */
  updateWorkHours(
    id: string,
    data: {
      hours: string;
      employee: string;
      date: string;
      location: string;
    }
  ): Observable<WorkHoursWithConflicts> {
    return this.http.patch<WorkHoursWithConflicts>(`${this.apiUrl}/${id}/`, data).pipe( // ← Poprawny format
      tap((response) => {
        this.scheduleUpdatedSubject.next(response);
      })
    );
  }

  /**
   * Usuwa godziny pracy
   * Zwraca conflicts dla pozostałych danych
   */
  deleteWorkHours(id: string): Observable<{ deleted: boolean; conflicts: ConflictData }> {
    return this.http.delete<{ deleted: boolean; conflicts: ConflictData }>(`${this.apiUrl}/${id}/`).pipe( // ← Poprawny format
      tap((response) => {
        this.scheduleUpdatedSubject.next({
          id,
          deleted: true,
          conflicts: response.conflicts
        } as any);
      })
    );
  }

  /**
   * Emituje event o aktualizacji (dla kompatybilności wstecznej)
   */
  emitScheduleUpdate(data: any): void {
    this.scheduleUpdatedSubject.next(data);
  }

  /**
   * Generuje PDF z grafikiem
   */
  generateSchedulePdf(locationId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set('location', locationId)
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get(`${this.apiUrl}/generate-schedule-pdf/`, { // ← Dodaj / na początku
      params,
      responseType: 'blob'
    }).pipe(
      tap((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grafik_${locationId}_${month}_${year}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      })
    );
  }

  /**
   * Generuje PDF z listami obecności
   */
  generateAttendanceSheets(locationId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set('location', locationId)
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get(`${this.apiUrl}/generate-attendance-sheets/`, { // ← Dodaj / na początku
      params,
      responseType: 'blob'
    }).pipe(
      tap((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lista_obecnosci_${locationId}_${month}_${year}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      })
    );
  }
}
