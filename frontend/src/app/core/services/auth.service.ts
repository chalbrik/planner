import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, BehaviorSubject, throwError, catchError, of} from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, AuthTokens} from './auth.model';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + 'auth/';

  private accessToken: string | null = null;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private isRefreshing = false;

  constructor(private http: HttpClient) {}

  init(): void {
    console.log('🔧 AuthService init() - start');

    // Odczytaj token z localStorage przy starcie
    this.accessToken = localStorage.getItem('access_token');
    console.log('🔑 Token z localStorage:', this.accessToken ? 'JEST' : 'BRAK');

    // Sprawdź czy token istnieje i czy jest ważny
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      console.log('✅ Token ważny - sprawdzam auth');
      this.checkAuth();
    } else if (this.accessToken && this.isTokenExpired(this.accessToken)) {
      console.log('⏰ Token wygasł - odświeżam');
      this.refreshToken().subscribe({
        next: () => {
          console.log('✅ Token odświeżony pomyślnie');
          this.checkAuth();
        },
        error: (err) => {
          console.log('❌ Błąd odświeżania tokenu:', err);
          this.clearAuthData();
        }
      });
    } else {
      console.log('🚫 Brak tokenu lub token nieprawidłowy');
      this.currentUserSubject.next(null);
    }
  }

  checkAuth(): void {
    console.log('🔍 checkAuth() - start');

    // Jeśli nie ma tokenu dostępu, nie próbuj sprawdzać autoryzacji
    if (!this.accessToken) {
      console.log('❌ checkAuth: brak tokenu');
      this.currentUserSubject.next(null);
      return;
    }

    console.log('📡 Wysyłam żądanie do /user/');
    this.http.get<User>(`${this.apiUrl}user/`, {withCredentials: true}).subscribe({
      next: (user: User) => {
        console.log('✅ checkAuth: otrzymano użytkownika', user);
        this.currentUserSubject.next(user);
      },
      error: (err) => {
        console.log('❌ checkAuth: błąd', err);
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
        localStorage.setItem('access_token', response.access);
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
        // DODANE: Zapisz nowy token do localStorage
        localStorage.setItem('access_token', response.access);
        this.isRefreshing = false;
      }),
      catchError(error => {
        this.isRefreshing = false;
        // DODANE: Wyczyść dane przy błędzie
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    localStorage.removeItem('access_token');

    if (!this.accessToken) {
      this.clearAuthData();
      return of({ detail: 'Wylogowano pomyślnie' });
    }

    return this.http.post<any>(`${this.apiUrl}logout/`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError(() => {
        this.clearAuthData();
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

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true; // Jeśli nie można zdekodować - token nieprawidłowy
    }
  }

  private clearAuthData(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem('access_token');
  }

}

