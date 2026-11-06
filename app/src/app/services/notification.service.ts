import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastController = inject(ToastController);

  constructor() {
  }

  success(message: string): Promise<void> {
    return this.displayToast(message, 'success-toast');
  }

  error(message: string): Promise<void> {
    return this.displayToast(message, 'error-toast');
  }

  info(message: string): Promise<void> {
    return this.displayToast(message, 'info-toast');
  }

  warn(message: string): Promise<void> {
    return this.displayToast(message, 'warn-toast');
  }

  private async displayToast(message: string, cssClass: string, duration: number = 3500) {
    const toast = await this.toastController
      .create({
        message,
        duration,
        cssClass,
        position: 'bottom',
      });

    await toast.present();
  }
}
