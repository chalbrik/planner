import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Disposal} from './disposal.types';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DisposalService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'forms';

  private _disposal = signal<Disposal[]>([])

  constructor() { }

  public disposal = this._disposal.asReadonly();

  getDisposals(params?: any): Observable<Disposal[]> {
    return this.http.get<Disposal[]>(`${this.apiUrl}/`, {params}).pipe(
      tap(response => {
        this._disposal.set(response);
      })
    )
  }

  deleteDisposal(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe( // ← OK
      tap(() => {
        this._disposal.update(current => current.filter(disposal => disposal.id !== id));
      })
    );
  }

}
