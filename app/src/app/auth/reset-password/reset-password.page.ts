import { Component, inject, OnInit } from '@angular/core';
import { AuthService, NotificationService } from '../../services';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

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
    IonContent,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    FormsModule
  ]
})
export class ResetPasswordPage implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isRequesting = false;
  payload: ResetPasswordPayload = {};

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
