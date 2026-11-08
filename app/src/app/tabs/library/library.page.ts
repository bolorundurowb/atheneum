import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { AuthorService, BookService, NotificationService, PublisherService } from '../../services';
import {
  InfiniteScrollCustomEvent,
  RefresherCustomEvent,
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
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BookComponent } from '../../shared/book/book.component';
import { EmptyComponent } from '../../shared/empty/empty.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, Subject, switchMap, tap, timer } from 'rxjs';
import { BookCard } from '../../models/book';

interface LibraryQuery {
  search: string;
  publisherId: string;
  authorId: string;
  publishYear?: number;
}

interface BookRequest {
  query: LibraryQuery;
  append: boolean;
  debounceMs: number;
  target?: { complete(): Promise<void> };
}

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
  books: BookCard[] = [];

  authors: any[] = [];
  publishers: any[] = [];

  search?: string;
  authorId?: string;
  publisherId?: string;
  yearFilter?: string;
  hasMore = false;
  isLoadingMore = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new Subject<BookRequest>();
  private lastQueryKey?: string;
  private loadedQuery?: LibraryQuery;
  currentPage = 1;
  limit = 50;

  ngOnInit(): void {
    this.requests.pipe(
      switchMap(request => {
        this.isLoading = !request.append && !request.target;
        this.isLoadingMore = request.append;
        if (!request.append) {
          this.hasMore = false;
        }
        const page = request.append ? this.currentPage + 1 : 1;
        return timer(request.debounceMs).pipe(
          switchMap(() => this.bookService.getAll$(
            (page - 1) * this.limit, this.limit, request.query.search,
            request.query.publisherId, request.query.authorId, request.query.publishYear
          )),
          tap(books => {
            this.books = request.append ? [...this.books, ...books] : books;
            this.currentPage = page;
            this.hasMore = books.length === this.limit;
            this.loadedQuery = request.query;
          }),
          catchError((error: unknown) => {
            void this.notificationService.error(error as string);
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
            this.isLoadingMore = false;
            void request.target?.complete();
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
    void this.loadFilterOptions();
    this.reload(0);
  }

  private async loadFilterOptions() {
    const authors = this.authorService.getAll()
      .then((result) => { this.authors = result; })
      .catch((error) => this.notificationService.error(error as string));
    const publishers = this.publisherService.getAll()
      .then((result) => { this.publishers = result; })
      .catch((error) => this.notificationService.error(error as string));

    await Promise.all([authors, publishers]);
  }

  async goToBookDetails(book: BookCard) {
    await this.navCtrl.navigateForward('/details/book', { queryParams: { book: JSON.stringify(book) } });
  }

  handlePullRefresh(event: RefresherCustomEvent): void {
    this.reload(0, event.target);
  }

  handleScrollEnd(event: InfiniteScrollCustomEvent): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMore || !this.loadedQuery) {
      void event.target.complete();
      return;
    }
    this.requests.next({ query: this.loadedQuery, append: true, debounceMs: 0, target: event.target });
  }

  handleSearch(value: string | null | undefined): void {
    this.search = value ?? '';
    this.reload(300);
  }

  handleFilter(): void {
    this.reload(0);
  }

  private reload(debounceMs: number, target?: BookRequest['target']): void {
    const query: LibraryQuery = {
      search: this.search?.trim() ?? '',
      publisherId: this.publisherId ?? '',
      authorId: this.authorId ?? '',
      publishYear: this.yearFilter ? Number(this.yearFilter) : undefined
    };
    const key = JSON.stringify(query);
    if (!target && key === this.lastQueryKey) {
      return;
    }
    this.lastQueryKey = key;
    this.requests.next({ query, append: false, debounceMs, target });
  }
}
