import { Component, OnInit, inject } from '@angular/core';
import {
  AuthorService,
  AuthService,
  BookService,
  NotificationService,
  PublisherService,
  StatisticService
} from '../../services';
import { IonCol, IonContent, IonGrid, IonRow, IonSpinner, NavController, IonRefresher, IonRefresherContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EmptyComponent } from '../../shared/empty/empty.component';
import { BookComponent } from '../../shared/book/book.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: [ 'home.page.scss' ],
  imports: [
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    FormsModule,
    BookComponent,
    EmptyComponent,
    IonRefresher,
    IonRefresherContent
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

  async loadData() {
    try {
      this.currentUser = this.authService.getUser();
      const requests = [
        this.statService.get().then(stats => { this.stats = stats; }),
        this.authorService.getTop().then(authors => { this.topAuthors = authors; }),
        this.bookService.getRecent().then(books => { this.recentBooks = books; }),
        this.publisherService.getTop().then(publishers => { this.topPublishers = publishers; })
      ];
      const failures: unknown[] = [];
      await Promise.all(requests.map(request => request.catch((error: unknown) => {
        failures.push(error);
      })));
      if (failures.length) {
        await this.notificationService.error(failures[0] as string);
      }
    } catch (e) {
      await this.notificationService.error(e as string);
    }
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.loadData();
    this.isLoading = false;
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  async goToBookDetails(book: any) {
    await this.navCtrl.navigateForward('/details/book', { queryParams: { book: JSON.stringify(book) } });
  }
}
