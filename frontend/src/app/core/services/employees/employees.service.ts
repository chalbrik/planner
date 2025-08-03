import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import { environment } from '../../../../environments/environment';
import {Employee} from './employee.types';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private apiUrl = environment.apiUrl + 'schedule/';

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

  addEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}employees/`, employee);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}employees/${id}/`);
  }




}
