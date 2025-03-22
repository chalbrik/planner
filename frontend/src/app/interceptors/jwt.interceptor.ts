import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {Observable, catchError, switchMap, throwError, delay} from 'rxjs';
import { AuthService } from '../core/services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // WAŻNE: Nie próbuj dodawać tokena do żądań odświeżania i logowania!
  if (req.url.includes('token/refresh') || req.url.includes('logout')) {
    return next(req.clone({ withCredentials: true }));
  }

  // Dodaj token tylko jeśli jest dostępny
  const token = authService.getAccessToken();

  //Zawsze dodajemy withCredentials:true dla zapytań API, aby cookies były wysyłane
  req = req.clone({
    withCredentials: true
  });

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
      if (error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !req.url.includes('token/refresh') &&
          !req.url.includes('logout')) {
        return handleUnauthorized(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handleUnauthorized(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  return authService.refreshToken().pipe(
    delay(1000),
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
      authService.logout().subscribe();
      return throwError(() => refreshError);
    })
  );
}
