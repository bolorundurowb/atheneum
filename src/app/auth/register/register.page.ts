import { Component } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";

interface RegisterPayload {
  fullName?: string;
  emailAddress?: string;
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: 'register.page.html',
  styleUrls: [ 'register.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class RegisterPage {
  isRegistering = false;
  payload: RegisterPayload = {};

  constructor(private authService: AuthService, private notificationService: NotificationService,
              private router: Router, private location: Location) {
  }

  async register() {
    this.isRegistering = true;

    try {
      const response = await this.authService.register(this.payload);

      await this.notificationService.success('Successfully registered');
      this.authService.persistUser(response);

      await this.router.navigate([ 'auth', 'verify' ]);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isRegistering = false;
    }
  }

  goBack() {
    this.location.back();
  }
}
