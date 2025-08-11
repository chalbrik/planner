import {inject, Injectable, signal} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {VacationLeaves} from './vacation-leaves.types';

@Injectable({
  providedIn: 'root'
})
export class VacationLeavesService {
  http = inject(HttpClient);

  private _vacationLeaves = signal<VacationLeaves>({
    id: '',
    employee: '',
    employee_name: '',
    current_vacation_days: 0,
    used_vacation_days: 0,
    remaining_vacation_days: 0,
    current_vacation_hours: 0,
    used_vacation_hours: 0,
    remaining_vacation_hours: 0,
  })

  private apiUrl = environment.apiUrl + 'schedule/';

  constructor() { }

  public vacationLeaves = this._vacationLeaves.asReadonly();

  getVacationLeaves(filters?: any): Observable<VacationLeaves> {
    return this.http.get<any>(`${this.apiUrl}vacation-leaves/`, { params: filters }).pipe(
      tap(responseData => {
        this._vacationLeaves.set(responseData)
      })
    );
  }
}
