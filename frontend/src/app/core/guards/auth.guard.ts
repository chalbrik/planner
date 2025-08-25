import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Pobierz token z localStorage
  const token = authService.getAccessToken();

  // Brak tokena - przekieruj na login
  if (!token) {
    // console.log('AuthGuard: No token found, redirecting to login');
    router.navigate(['/auth/login']);
    return false;
  }

  // Token wygasł - wyczyść dane i przekieruj na login
  if (authService.isTokenExpired(token)) {
    // console.log('AuthGuard: Token expired, clearing auth data');
    authService.clearAuthData();
    router.navigate(['/auth/login']);
    return false;
  }

  // Token wygląda OK - przepuść użytkownika
  // checkAuth() będzie weryfikować z serverem asynchronicznie w tle
  // console.log('AuthGuard: Token valid, allowing access');
  return true;
};

// Dodaj metodę isTokenExpired i clearAuthData do AuthService jako public
// Lub dodaj je do interfejsu AuthService jeśli są private
