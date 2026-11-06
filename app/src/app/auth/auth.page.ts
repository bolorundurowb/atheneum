import { Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: 'auth.page.html',
  styleUrls: [ 'auth.page.scss' ],
  imports: [
    IonRouterOutlet
  ]
})
export class AuthPage {
}
