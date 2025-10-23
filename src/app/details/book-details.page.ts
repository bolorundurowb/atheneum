import { Component } from '@angular/core';
import {IonicModule} from "@ionic/angular";

@Component({
  selector: 'app-details',
  standalone: true,
  templateUrl: 'book-details-page.component.html',
  styleUrl: 'book-details-page.component.scss',
  imports: [
    IonicModule
  ]
})
export class BookDetailsPage {
}
