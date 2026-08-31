import { Component, OnInit, inject } from '@angular/core';
import { AuthorService, BookService, NotificationService, PublisherService } from '../../services';
import {
  InfiniteScrollCustomEvent,
  IonCol,
  IonContent,
  IonGrid,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  NavController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { BookComponent } from '../../shared/book/book.component';
import { EmptyComponent } from '../../shared/empty/empty.component';

@Component({
  selector: 'app-library',
  standalone: true,
  templateUrl: 'library.page.html',
  styleUrls: [ 'library.page.scss' ],
  imports: [
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonInput,
    IonSpinner,
    FormsModule,
    BookComponent,
    EmptyComponent
  ]
})
export class LibraryPage implements OnInit {
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private publisherService = inject(PublisherService);
  private notificationService = inject(NotificationService);
  private navCtrl = inject(NavController);

  isLoading = false;
  books: any[] = [];

  authors: any[] = [];
  publishers: any[] = [];

  search?: string;
  authorId?: string;
  publisherId?: string;
  yearFilter?: string;
  currentPage = 1;
  limit = 50;

  async ngOnInit() {
    this.isLoading = true;

    try {
      this.books = await this.fetchBooks(this.getSkip(), this.limit);
      this.authors = await this.authorService.getAll();
      this.publishers = await this.publisherService.getAll();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoading = false;
    }
  }

  async goToBookDetails(book: any) {
    await this.navCtrl.navigateForward('/details/book', { queryParams: { book: JSON.stringify(book) } });
  }

  async handlePullRefresh(event: any) {
    this.currentPage = 1;
    const skip = this.getSkip();

    try {
      this.books = await this.fetchBooks(skip, this.limit);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      event.target.complete();
    }
  }

  async handleScrollEnd(event: any) {
    try {
      // check to see if there are more books before querying
      if ((this.books.length % this.limit) !== 0) {
        console.log('There arent more books because the initial load did not meet the limit');
      } else {
        this.currentPage += 1;
        const skip = this.getSkip();
        const books = await this.fetchBooks(skip, this.limit);
        this.books = [ ...this.books, ...books ];
      }
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      await (event as InfiniteScrollCustomEvent).target.complete();
    }
  }

  async handleSearch(event: any) {
    console.log(event.key, this.search);

    this.books = [];
    this.isLoading = true;
    this.currentPage = 1;
    const skip = this.getSkip();

    try {
      this.books = await this.fetchBooks(skip, this.limit);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoading = false;
    }
  }

  async handleFilter() {
    this.books = [];
    this.isLoading = true;
    this.currentPage = 1;
    const skip = this.getSkip();

    try {
      this.books = await this.fetchBooks(skip, this.limit);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoading = false;
    }
  }

  fetchBooks(skip: number, limit: number) {
    const publishYear = this.yearFilter ? Number(this.yearFilter) : undefined;
    return this.bookService.getAll(
      skip,
      limit,
      this.search,
      this.publisherId,
      this.authorId,
      publishYear
    );
  }

  getSkip() {
    return (this.currentPage - 1) * this.limit;
  }
}
