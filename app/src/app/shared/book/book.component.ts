import { Component, Input } from '@angular/core';
import { convertToHttps } from '../../utils';
import { fadeInUp } from '../../animations';

@Component({
  selector: 'app-book',
  standalone: true,
  animations: [ fadeInUp ],
  template: `
    <div class="book" [@fadeInUp]>
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
