import { inject } from '@angular/core';
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { AuthService } from '../services';
import { catchError, throwError } from 'rxjs';
import { isApiRequest } from './api-request';

export const errorInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  if (!isApiRequest(request.url)) {
    return next(request);
  }

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
