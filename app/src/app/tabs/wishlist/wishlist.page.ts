import { Component, inject, OnInit } from '@angular/core';
import { NotificationService, WishlistService } from '../../services';
import { FormsModule } from '@angular/forms';
import { BookComponent } from '../../shared/book/book.component';
import { EmptyComponent } from '../../shared/empty/empty.component';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonLabel,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

interface AddToWishlistPayload {
  bookTitle?: string;
  bookAuthor?: string;
  bookIsbn?: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  templateUrl: 'wishlist.page.html',
  styleUrls: [ 'wishlist.page.scss' ],
  imports: [
    FormsModule,
    IonContent,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonLabel,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    BookComponent,
    EmptyComponent
  ]
})
export class WishlistPage implements OnInit {
  private wishlistService = inject(WishlistService);
  private notificationService = inject(NotificationService);

  isLoading = false;
  wishlist: any[] = [];

  isAdding: boolean = false;
  addPayload: AddToWishlistPayload = {};

  constructor() {
    addIcons({ close });
  }

  async ngOnInit() {
    this.isLoading = true;

    try {
      await this.loadData();
    } finally {
      this.isLoading = false;
    }
  }

  async addToWishlist(modalRef: any) {
    this.isAdding = true;

    try {
      const book = await this.wishlistService.add(this.addPayload);
      await this.notificationService.success('Book added to wishlist');

      this.wishlist.unshift(book);
      this.addPayload = {};

      modalRef.dismiss();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isAdding = false;
    }
  }

  async handlePullRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  async canDismiss(data?: any, role?: string) {
    return role === undefined;
  }

  async loadData() {
    try {
      this.wishlist = await this.wishlistService.getAll();
    } catch (e) {
      await this.notificationService.error(e as string);
    }
  }
}
