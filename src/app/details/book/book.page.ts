import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { BookService, NotificationService } from '../../services';
import { convertToHttps } from '../../utils';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-book-details',
  standalone: true,
  templateUrl: 'book.page.html',
  styleUrl: 'book.page.scss',
  imports: [
    IonicModule,
    DatePipe
  ]
})
export class BookPage implements OnInit {
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private notificationService = inject(NotificationService);
  private bookService = inject(BookService);

  book: any;
  removeButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'Proceed',
      role: 'confirm',
      handler: async () => {
        try {
          await this.bookService.removeBook(this.book.id);
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
    console.log(await this.navCtrl.pop());
  }
}
