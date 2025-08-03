import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated();
  console.log('🛡️ AuthGuard: isAuthenticated =', isAuth);

  if (isAuth) {
    return true;
  }

  console.log('🛡️ AuthGuard: przekierowuję do logowania');
  router.navigate(['/auth/login']);
  return false;
};
