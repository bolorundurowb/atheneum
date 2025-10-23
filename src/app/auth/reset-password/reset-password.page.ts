import { Component, OnInit } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { ActivatedRoute, Router } from '@angular/router';
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";

interface ResetPasswordPayload {
  emailAddress?: string;
  resetCode?: string;
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: 'reset-password.page.html',
  styleUrls: [ 'reset-password.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class ResetPasswordPage implements OnInit {
  isRequesting = false;
  payload: ResetPasswordPayload = {};

  constructor(private authService: AuthService, private notificationService: NotificationService,
              private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.payload.emailAddress = (this.route.snapshot.queryParams as any).email;
  }

  async resetPassword() {
    this.isRequesting = true;

    try {
      await this.authService.resetPassword(this.payload);
      await this.notificationService.success('Your password has been reset. You can now log in.');
      this.payload = {};

      await this.router.navigate([ 'auth', 'login' ]);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isRequesting = false;
    }
  }
}
