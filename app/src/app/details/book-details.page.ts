import { Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-details',
  standalone: true,
  templateUrl: 'book-details-page.component.html',
  styleUrl: 'book-details-page.component.scss',
  imports: [
    IonRouterOutlet
  ]
})
export class BookDetailsPage {
}
