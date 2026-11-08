import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BookService } from './book.service';
import { BookCard } from '../models/book';

describe('Book list HTTP requests', () => {
  let service: BookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BookService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserves filters and cancels the HTTP request when unsubscribed', () => {
    const subscription = service.getAll$(50, 50, 'A&B', 'publisher', 'author', 2020).subscribe();
    const request = http.expectOne(candidate => candidate.url.includes('/v1/books?'));
    const params = new URL(request.request.urlWithParams).searchParams;
    expect(params.get('search')).toBe('A&B');
    expect(params.get('skip')).toBe('50');
    expect(params.get('limit')).toBe('50');
    expect(params.get('publisherId')).toBe('publisher');
    expect(params.get('authorId')).toBe('author');
    expect(params.get('publishYear')).toBe('2020');
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
  });

  it('keeps the Promise-based list method compatible', async () => {
    const books: BookCard[] = [{ _id: 'book-a', title: 'Example' }];
    const result = service.getAll();
    http.expectOne(request => request.url.includes('/v1/books?')).flush(books);
    expect(await result).toEqual(books);
  });
});
