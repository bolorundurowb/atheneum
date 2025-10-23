import { Component, OnInit } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { Router } from '@angular/router';
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";

interface VerificationPayload {
  verificationCode?: string;
}

@Component({
  selector: 'app-verify',
  standalone: true,
  templateUrl: 'verify.page.html',
  styleUrls: [ 'verify.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class VerifyPage implements OnInit {
  isVerifying = false;
  payload: VerificationPayload = {};

  isResending = false;
  resendWaitRemaining = 0;

  constructor(private authService: AuthService, private notificationService: NotificationService,
              private router: Router) {
  }

  ngOnInit() {
    this.setupResend();
  }

  async verify() {
    this.isVerifying = true;

    try {
      this.payload.verificationCode = this.payload.verificationCode?.toString();
      await this.authService.verifyEmail(this.payload);
      await this.notificationService.success('Account successfully verified');

      const user = this.authService.getUser();
      user.isEmailVerified = true;
      this.authService.persistUser(user);

      await this.router.navigate([ 'tabs', 'home' ]);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isVerifying = false;
    }
  }

  setupResend() {
    this.resendWaitRemaining = 5;

    const intervalId = setInterval(() => {
      if (this.resendWaitRemaining === 0) {
        clearInterval(intervalId);
      } else {
        this.resendWaitRemaining -= 1;
      }
    }, 1000);
  }

  async resend() {
    this.isResending = true;

    try {
      await this.authService.resendVerificationCode();
      await this.notificationService.success('Reset code successfully resent');

      this.setupResend();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isResending = false;
    }
  }
}
