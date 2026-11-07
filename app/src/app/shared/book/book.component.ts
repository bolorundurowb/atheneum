import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { fadeInUp } from '../../animations';
import { BookCard } from '../../models/book';
import { thumbnailUrl } from './thumbnail';

@Component({
  selector: 'app-book',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [ fadeInUp ],
  template: `
    <div class="book" [@fadeInUp]>
      <img [src]="httpsCoverArt" [alt]="book.title" loading="lazy" decoding="async" width="130" height="195"/>
      <div class="title">{{ book.title }}</div>
      <div class="author">{{ book.authors ? book.authors[0]?.name : book.authorName }}</div>
    </div>
  `,
  styleUrls: ['./book.component.scss']
})
export class BookComponent {
  @Input() book!: BookCard;

  get httpsCoverArt() {
    return thumbnailUrl(this.book.coverArt);
  }
}
