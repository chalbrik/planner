import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl: string = 'http://localhost:8000/api/schedule/';

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}employees`);
  }

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

  addEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}employees/`, employee);
  }

  addWorkHours(workHours: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}work-hours/`, workHours);
  }

  updateWorkHours(id: number, workHours: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}work-hours/${id}/`, workHours);
  }

  deleteWorkHours(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}work-hours/${id}/`);
  }
}
