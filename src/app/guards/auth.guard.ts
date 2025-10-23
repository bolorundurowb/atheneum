import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  private authService = inject(AuthService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      if (this.authService.getUser().isEmailVerified) {
        return true;
      }

      window.location.href = '/auth/verify';
      return false;
    }

    window.location.href = '/auth/login';
    return false;
  }
}
