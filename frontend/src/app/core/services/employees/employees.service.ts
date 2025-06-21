import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private apiUrl: string = 'http://localhost:8000/api/schedule/';

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}employees`);
  }

  addEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}employees/`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}employees/${id}/`);
  }


}
