import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResetPasswordPage } from './reset-password.page';
import { ResetPasswordPageRoutingModule } from './reset-password-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ResetPasswordPageRoutingModule,
    ResetPasswordPage
  ]
})
export class ResetPasswordPageModule {
}
