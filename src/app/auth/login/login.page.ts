import { Component, inject } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { Router } from '@angular/router';
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";

interface LoginPayload {
  emailAddress?: string;
  password?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: 'login.page.html',
  styleUrls: [ 'login.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isLoggingIn = false;
  payload: LoginPayload = {};

  async login() {
    this.isLoggingIn = true;

    try {
      const response = await this.authService.login(this.payload);

      await this.notificationService.success('Successfully logged in');
      this.authService.persistUser(response);

      if (response.isEmailVerified) {
        await this.router.navigate([ 'tabs', 'home' ]);
      } else {
        await this.router.navigate([ 'auth', 'verify' ]);
      }
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoggingIn = false;
    }
  }
}
