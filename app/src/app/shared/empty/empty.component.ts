import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fileTrayOutline } from 'ionicons/icons';

@Component ({
  selector: 'app-empty',
  standalone: true,
  template: `
    <div class="empty">
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
