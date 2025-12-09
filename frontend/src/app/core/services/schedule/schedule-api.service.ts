/**
 * ScheduleApiService - Czysty HTTP layer dla grafików
 *
 * TYLKO HTTP calls, ZERO side effects!
 * - Brak tap() z logiką
 * - Brak Subject
 * - Brak auto-download
 * - Brak modyfikacji state
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkHours } from './schedule.types';
import { environment } from '../../../../environments/environment';

/**
 * Response z backendu - work_hours + conflicts
 */
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

/**
 * Czysty API service - tylko HTTP calls
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleApiService{
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'schedule';

  // ========================================
  // GET - Pobierz godziny pracy
  // ========================================

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

    return this.http.get<WorkHoursResponse>(`${this.apiUrl}/`, { params });
  }

  // ========================================
  // POST - Dodaj godziny pracy
  // ========================================

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
    return this.http.post<WorkHoursWithConflicts>(`${this.apiUrl}/`, data);
  }

  // ========================================
  // PATCH - Aktualizuj godziny pracy
  // ========================================

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
    return this.http.patch<WorkHoursWithConflicts>(`${this.apiUrl}/${id}/`, data);
  }

  // ========================================
  // DELETE - Usuń godziny pracy
  // ========================================

  /**
   * Usuwa godziny pracy
   * Zwraca conflicts dla pozostałych danych
   */
  deleteWorkHours(id: string): Observable<{ deleted: boolean; conflicts: ConflictData }> {
    return this.http.delete<{ deleted: boolean; conflicts: ConflictData }>(`${this.apiUrl}/${id}/`);
  }

  // ========================================
  // GET - Generuj PDF (zwraca Blob, BEZ auto-download!)
  // ========================================

  /**
   * Generuje PDF z grafikiem
   * UWAGA: Zwraca Observable<Blob>, NIE downloaduje automatycznie!
   */
  generateSchedulePdf(locationId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set('location', locationId)
      .set('month', month.toString())
      .set('year', year.toString());

    // Zwraca TYLKO Blob, bez side effects
    return this.http.get(`${this.apiUrl}/generate-schedule-pdf/`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Generuje PDF z listami obecności
   * UWAGA: Zwraca Observable<Blob>, NIE downloaduje automatycznie!
   */
  generateAttendanceSheets(locationId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set('location', locationId)
      .set('month', month.toString())
      .set('year', year.toString());

    // Zwraca TYLKO Blob, bez side effects
    return this.http.get(`${this.apiUrl}/generate-attendance-sheets/`, {
      params,
      responseType: 'blob'
    });
  }
}
