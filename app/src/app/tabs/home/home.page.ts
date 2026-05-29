import { Component, OnInit, inject } from '@angular/core';
import {
  AuthorService,
  AuthService,
  BookService,
  NotificationService,
  PublisherService,
  StatisticService
} from '../../services';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EmptyComponent } from '../../shared/empty/empty.component';
import { BookComponent } from '../../shared/book/book.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: [ 'home.page.scss' ],
  imports: [
    IonicModule,
    FormsModule,
    BookComponent,
    EmptyComponent
  ]
})
export class HomePage implements OnInit {
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private publisherService = inject(PublisherService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private navCtrl = inject(NavController);
  private statService = inject(StatisticService);

  isLoading = false;
  currentUser: any = {};
  stats: any = {};
  recentBooks: any[] = [];
  topAuthors: any[] = [];
  topPublishers: any[] = [];

  async ngOnInit() {
    this.isLoading = true;

    try {
      this.stats = await this.statService.get();
      this.currentUser = this.authService.getUser();
      this.topAuthors = await this.authorService.getTop();
      this.recentBooks = await this.bookService.getRecent();
      this.topPublishers = await this.publisherService.getTop();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoading = false;
    }
  }

  async goToBookDetails(book: any) {
    await this.navCtrl.navigateForward('/details/book', { queryParams: { book: JSON.stringify(book) } });
  }
}
