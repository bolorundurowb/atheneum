import { Component, Input } from '@angular/core';
import { convertToHttps } from '../../utils';

@Component({
  selector: 'app-book',
  standalone: true,
  template: `
    <div class="book">
      <img [src]="httpsCoverArt"/>
      <div class="title">{{ book.title }}</div>
      <div class="author">{{ book.authors ? book.authors[0]?.name : book.authorName }}</div>
    </div>
  `,
  styleUrls: ['./book.component.scss']
})
export class BookComponent {
  @Input() book: any;

  get httpsCoverArt() {
    return convertToHttps(this.book.coverArt);
  }
}
