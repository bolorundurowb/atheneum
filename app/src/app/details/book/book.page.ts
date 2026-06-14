import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BookService, NotificationService } from '../../services';
import { convertToHttps } from '../../utils';
import { DatePipe } from '@angular/common';

interface LendBookPayload {
  borrowerName?: string;
}

@Component({
  selector: 'app-book-details',
  standalone: true,
  templateUrl: 'book.page.html',
  styleUrl: 'book.page.scss',
  imports: [
    IonicModule,
    FormsModule,
    DatePipe
  ]
})
export class BookPage implements OnInit {
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private notificationService = inject(NotificationService);
  private bookService = inject(BookService);

  book: any;

  isLendModalVisible = false;
  isLending = false;
  lendPayload: LendBookPayload = {};

  removeButtons = [
    { text: 'Cancel', role: 'cancel', handler: () => {} },
    {
      text: 'Proceed',
      role: 'confirm',
      handler: async () => {
        try {
          await this.bookService.removeBook(this.book._id);
          await this.notificationService.success('Book successfully removed');
          await this.goBack();
        } catch (e) {
          await this.notificationService.error(e as string);
        }
      }
    }
  ];

  protected readonly convertToHttps = convertToHttps;

  ngOnInit() {
    this.book = JSON.parse((this.route.snapshot.queryParams as any).book);
  }

  async goBack() {
    const wasPopped = await this.navCtrl.pop();
    if (!wasPopped) {
      this.navCtrl.back();
    }
  }

  openBorrowDialog() {
    this.lendPayload = {};
    this.isLendModalVisible = true;
  }

  dismissLendModal() {
    this.isLendModalVisible = false;
    this.lendPayload = {};
  }

  async lendBook() {
    if (!this.lendPayload.borrowerName?.trim()) {
      await this.notificationService.error('Please enter a borrower name');
      return;
    }

    this.isLending = true;

    try {
      await this.bookService.borrowBook(this.book._id, this.lendPayload.borrowerName.trim());
      this.book = await this.bookService.getBook(this.book._id);
      await this.notificationService.success('Book marked as lent');
      this.dismissLendModal();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLending = false;
    }
  }

  async returnBook() {
    try {
      await this.bookService.returnBook(this.book._id);
      this.book = await this.bookService.getBook(this.book._id);
      await this.notificationService.success('Book marked as returned');
    } catch (e) {
      await this.notificationService.error(e as string);
    }
  }

  async canDismiss(data?: any, role?: string) {
    return role === undefined;
  }

  get currentLoan() {
    return this.book?.borrowingHistory?.find((x: any) => !x.returnedAt);
  }

  get lendingHistory() {
    return (this.book?.borrowingHistory ?? []).filter((x: any) => x.returnedAt).reverse();
  }
}
