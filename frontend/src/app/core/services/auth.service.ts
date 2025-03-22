import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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



  constructor(private http: HttpClient) {
    //Sprawdzenie autentykacji użytkownika
    this.checkAuth();
  }

  checkAuth(): void {
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
    return this.http.post<AuthTokens>(`${this.apiUrl}token/`,
      { username, password },
      { withCredentials: true } //pozwala na akceptowanie cookies
    ).pipe(
        tap(response => {
          this.accessToken = response.accessToken;
          this.loadUserProfile();
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, userData);
  }

  refreshToken(): Observable<any> {
    // Refresh token jest już w cookie, więc nie trzeba go przesyłać
    return this.http.post<AuthTokens>(`${this.apiUrl}token/refresh/`,
      {},
      {withCredentials: true}
    ).pipe(
        tap(response => {
          this.accessToken = response.accessToken;
        })
      );
  }

  logout(): Observable<any> {
    //Wysyłamy żądanie do backendu, żeby wyczyścił cookie z refresh token

    return this.http.post<any>(`${this.apiUrl}logout/`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(() => {
        this.accessToken = null;
        this.currentUserSubject.next(null);
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
