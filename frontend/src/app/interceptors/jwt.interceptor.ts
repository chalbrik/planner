// src/app/interceptors/jwt.interceptor.ts
import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Dodaj token tylko jeśli jest dostępny
  const token = localStorage.getItem('access_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: any) => {
      // Obsługa błędu 401 (Unauthorized)
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('token/refresh')) {
        return handleUnauthorized(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handleUnauthorized(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  return authService.refreshToken().pipe(
    switchMap(token => {
      // Ponów żądanie z nowym tokenem
      const updatedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token.access}`
        }
      });
      return next(updatedReq);
    }),
    catchError(refreshError => {
      // Jeśli odświeżenie się nie powiedzie, wyloguj użytkownika
      authService.logout();
      return throwError(() => refreshError);
    })
  );
}
