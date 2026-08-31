import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fileTrayOutline } from 'ionicons/icons';
import { fadeIn } from '../../animations';

@Component ({
  selector: 'app-empty',
  standalone: true,
  animations: [ fadeIn ],
  template: `
    <div class="empty" [@fadeIn]>
      <ion-icon name="file-tray-outline" size="large"></ion-icon>
      <div class="message">{{ message }}</div>
    </div>
  `,
  imports: [
    IonIcon
  ],
  styleUrls: ['./empty.component.scss']
})
export class EmptyComponent {
  @Input() message!: string;

  constructor() {
    addIcons({ fileTrayOutline });
  }
}
