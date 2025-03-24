import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, BehaviorSubject, throwError, catchError, of} from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, AuthTokens} from './auth.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth/';

  private accessToken: string | null = null;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private isRefreshing = false;

  constructor(private http: HttpClient) {}

  init(): void {
    //na moment pracy developerskiej
    this.accessToken = localStorage.getItem('access_token');
    //

    //Sprawdzenie autentykacji użytkownika
    this.checkAuth();
  }

  checkAuth(): void {
    // Jeśli nie ma tokenu dostępu, nie próbuj sprawdzać autoryzacji
    if (!this.accessToken) {
      this.currentUserSubject.next(null);
      return;
    }

    this.http.get<User>(`${this.apiUrl}user/`, {withCredentials: true}).subscribe({
      next: (user: User) => {
        this.currentUserSubject.next(user);
      },
      error: (err) => {
        this.currentUserSubject.next(null);
        console.error("Błąd statusu autentykacji użytkownika: ", err);
      }
    })
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{access: string}>(`${this.apiUrl}token/`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        //na moment pracy developerskiej
        localStorage.setItem('access_token', response.access);
        //

        this.accessToken = response.access;
        this.loadUserProfile();
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, userData);
  }

  refreshToken(): Observable<any> {
    if (this.isRefreshing) {
      return throwError(() => new Error('Odświeżanie tokenu już w toku'));
    }

    this.isRefreshing = true;

    return this.http.post<{access: string}>(`${this.apiUrl}token/refresh/`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(response => {
        this.accessToken = response.access;
        this.isRefreshing = false;
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.accessToken = null;
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {

    //na moment pracy developerskiej
    localStorage.removeItem('access_token');
    //

    //Wysyłamy żądanie do backendu, żeby wyczyścił cookie z refresh token
    if (!this.accessToken) {
      this.accessToken = null;
      this.currentUserSubject.next(null);
      return of({ detail: 'Wylogowano pomyślnie' });
    }

    return this.http.post<any>(`${this.apiUrl}logout/`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(() => {
        this.accessToken = null;
        this.currentUserSubject.next(null);
      }),
      catchError(() => {
        this.accessToken = null;
        this.currentUserSubject.next(null);
        return of({ detail: 'Wylogowano pomyślnie' });
      })
    );
  }

  private loadUserProfile(): void {
    this.http.get<User>(`${this.apiUrl}user/`,
      {withCredentials: true}
    ).subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}
