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

  _vacationLeaves = signal<VacationLeaves[]>([])

  private apiUrl = environment.apiUrl + 'schedule/';

  constructor() { }

  public vacationLeaves = this._vacationLeaves.asReadonly();

  getVacationLeaves(filters?: any): Observable<VacationLeaves[]> {
    return this.http.get<any[]>(`${this.apiUrl}vacation-leaves/`, { params: filters }).pipe(
      tap(responseData => {
        this._vacationLeaves.set(responseData)
      })
    );
  }
}
