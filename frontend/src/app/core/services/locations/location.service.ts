import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import {Location} from './location.types';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'locations';

  private _locations = signal<Location[]>([]);

  constructor() { }

  public locations = this._locations.asReadonly();

  // Pobierz wszystkie lokacje
  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/`).pipe(
      tap(responseData => {
        // console.log("Response data: ", responseData);
        this._locations.set(responseData);
      })
    );
  }

  // Pobierz jedną lokację po ID
  getLocation(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}/`);
  }

  // Dodaj nową lokację
  addLocation(location: Partial<Location>): Observable<Location> {
    return this.http.post<Location>(`${this.apiUrl}/`, location).pipe(
      tap(newLocation => {
        this._locations.update(current => [...current, newLocation]);
      })
    );
  }

  // Zaktualizuj lokację
  updateLocation(id: string, location: Partial<Location>): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/${id}/`, location).pipe(
      tap(updatedLocation => {
        this._locations.update(current =>
          current.map(loc => loc.id === id ? updatedLocation : loc)
        );
      })
    );
  }

  // Usuń lokację
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe(
      tap(() => {
        this._locations.update(current => current.filter(loc => loc.id !== id));
      })
    );
  }
}
