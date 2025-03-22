// frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth/';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}token/`, { username, password })
      .pipe(
        tap(tokens => {
          this.storeTokens(tokens);
          this.loadUserProfile();
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, userData);
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<any>(`${this.apiUrl}token/refresh/`, { refresh: refreshToken })
      .pipe(
        tap(tokens => {
          localStorage.setItem('access_token', tokens.access);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private storeTokens(tokens: any): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private loadUserProfile(): void {
    this.http.get<any>(`${this.apiUrl}user/`).subscribe(user => {
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
