import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import {MAT_DIALOG_DEFAULT_OPTIONS} from '@angular/material/dialog';
import {AuthService} from './core/services/auth.service';
import {provideNativeDateAdapter} from '@angular/material/core';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';
import {environment} from '../environments/environment';

function initializeAuth(authService: AuthService) {
  return () => authService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideNativeDateAdapter(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}},
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    },
    ...NgxGoogleAnalyticsModule.forRoot(environment.googleAnalyticsId).providers || [],
    ...NgxGoogleAnalyticsRouterModule.forRoot().providers || []
  ]
};
