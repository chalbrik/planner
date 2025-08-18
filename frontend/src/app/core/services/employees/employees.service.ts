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
  private apiUrl = environment.apiUrl + 'employees/';

  _http = inject(HttpClient);

  private _employees = signal<Employee[]>([])

  constructor(private http: HttpClient) { }

  public employees = this._employees.asReadonly();

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}employees`).pipe(
      tap(responseData => {
        this._employees.set(responseData)
      })
    );
  }

  addEmployee(employee: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}employees/`, employee).pipe(
      tap(newEmployee => {
        // Dodaj nowego pracownika do sygnału
        this._employees.update(current => [...current, newEmployee]);
      })
    );
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}employees/${id}/`).pipe(
      tap(() => {
        // Usuń pracownika z sygnału
        this._employees.update(current => current.filter(emp => emp.id !== id));
      })
    );
  }




}
