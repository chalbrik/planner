import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import { environment } from '../../../../environments/environment';
import {CreateEmployeeRequest, Employee} from './employee.types';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'employees'; // ← Usuń slash na końcu

  private _employees = signal<Employee[]>([])

  constructor() { } // ← Usuń konstruktor z http

  public employees = this._employees.asReadonly();

  getEmployees(params?: any): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/`, { params }).pipe( // ← OK
      tap(responseData => {
        this._employees.set(responseData)
      })
    );
  }

  getEmployeeDetail(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}/`);
  }

  addEmployee(employee: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/`, employee).pipe( // ← Zmień URL
      tap(newEmployee => {
        this._employees.update(current => [...current, newEmployee]);
      })
    );
  }

  updateEmployee(id: string, employee: Partial<CreateEmployeeRequest>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}/`, employee).pipe(
      tap(updatedEmployee => {
        this._employees.update(current =>
          current.map(emp => emp.id === id ? updatedEmployee : emp)
        );
      })
    );
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe( // ← OK
      tap(() => {
        this._employees.update(current => current.filter(emp => emp.id !== id));
      })
    );
  }
}
