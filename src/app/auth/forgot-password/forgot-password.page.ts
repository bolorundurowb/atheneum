import { Component } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { Router } from '@angular/router';
import {IonicModule, NavController} from '@ionic/angular';
import {FormsModule} from "@angular/forms";

interface ForgotPasswordPayload {
  emailAddress?: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: 'forgot-password.page.html',
  styleUrls: [ 'forgot-password.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class ForgotPasswordPage {
  isRequesting = false;
  payload: ForgotPasswordPayload = {};

  constructor(private authService: AuthService, private notificationService: NotificationService,
              private navCtrl: NavController) {
  }

  async requestReset() {
    this.isRequesting = true;

    try {
      await this.authService.forgotPassword(this.payload);
      await this.notificationService.success('A reset code has been sent your email address');

      setTimeout(async () => {
        await this.navCtrl.navigateForward('/auth/reset-password', { queryParams: { email: this.payload.emailAddress } });
      }, 1500);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isRequesting = false;
    }
  }
}
