import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { BookComponent } from './book.component';
import { BookCard } from '../../models/book';

describe('Book card rendering', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BookComponent], providers: [provideNoopAnimations()] });
  });

  it('renders accessible lazy thumbnails, reserved dimensions, title and author', () => {
    const fixture = TestBed.createComponent(BookComponent);
    const book: BookCard = {
      _id: 'book-a', title: 'Example book',
      coverArt: 'https://res.cloudinary.com/library/image/upload/cover.jpg',
      authors: [{ _id: 'author-a', name: 'Example author' }]
    };
    fixture.componentRef.setInput('book', book);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector('img');
    expect(image?.alt).toBe('Example book');
    expect(image?.getAttribute('loading')).toBe('lazy');
    expect(image?.getAttribute('width')).toBe('130');
    expect(image?.getAttribute('height')).toBe('195');
    expect(image?.src).toContain('/c_limit,w_320,h_480,q_auto,f_auto/');
    expect(element.querySelector('.title')?.textContent).toBe('Example book');
    expect(element.querySelector('.author')?.textContent).toBe('Example author');
  });

  it('renders wishlist authors when no cover is available', () => {
    const fixture = TestBed.createComponent(BookComponent);
    fixture.componentRef.setInput('book', { _id: 'wish-a', title: 'Wishlist book', authorName: 'Wishlist author' } satisfies BookCard);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.author')?.textContent).toBe('Wishlist author');
    expect(element.querySelector('img')?.getAttribute('src') ?? '').toBe('');
  });
});
