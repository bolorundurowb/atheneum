import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { AuthService, NotificationService } from '../services';
import { catchError, Observable, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  return next(request).pipe(catchError(error => {
    const errorStatus = error.status;
    const errorMessage = error.error?.message ?? error.message;

    if (errorStatus === 401) {
      authService.logout();
      window.location.href = '/auth/login';
    }

    return throwError(() => errorMessage);
  }));
};
