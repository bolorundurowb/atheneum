import { Component, OnInit, inject } from '@angular/core';
import { BookService, NotificationService } from '../../services';
import { InfiniteScrollCustomEvent, IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BookComponent } from '../../shared/book/book.component';
import { EmptyComponent } from '../../shared/empty/empty.component';

@Component({
  selector: 'app-library',
  standalone: true,
  templateUrl: 'library.page.html',
  styleUrls: [ 'library.page.scss' ],
  imports: [
    IonicModule,
    FormsModule,
    BookComponent,
    EmptyComponent
  ]
})
export class LibraryPage implements OnInit {
  private bookService = inject(BookService);
  private notificationService = inject(NotificationService);
  private navCtrl = inject(NavController);

  isLoading = false;
  books: any[] = [];

  search?: string;
  currentPage = 1;
  limit = 50;

  async ngOnInit() {
    this.isLoading = true;

    try {
      this.books = await this.bookService.getAll();
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
      this.books = await this.bookService.getAll(skip, this.limit, this.search);
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
        const books = await this.bookService.getAll(skip, this.limit, this.search);
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
      this.books = await this.bookService.getAll(skip, this.limit, this.search);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isLoading = false;
    }
  }

  getSkip() {
    return (this.currentPage - 1) * this.limit;
  }
}
