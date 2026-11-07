import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BookService } from '../src/app/services/book.service.ts';

test('list queries preserve filters and unsubscribe from the HTTP source when cancelled', () => {
  let url;
  let cancelled = false;
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: { get: value => {
      url = value;
      return new Observable(() => () => { cancelled = true; });
    } } }
  ], null);
  try {
    const service = runInInjectionContext(injector, () => new BookService());
    const subscription = service.getAll$(50, 50, 'A&B', 'publisher', 'author', 2020).subscribe();
    const params = new URL(url).searchParams;
    assert.equal(params.get('search'), 'A&B');
    assert.equal(params.get('skip'), '50');
    assert.equal(params.get('limit'), '50');
    assert.equal(params.get('publisherId'), 'publisher');
    assert.equal(params.get('authorId'), 'author');
    assert.equal(params.get('publishYear'), '2020');
    subscription.unsubscribe();
    assert.equal(cancelled, true);
  } finally { injector.destroy(); }
});

test('the existing Promise-based list method stays compatible', async () => {
  const books = [{ _id: 'book-a', title: 'Example' }];
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: { get: () => of(books) } }
  ], null);
  try {
    const service = runInInjectionContext(injector, () => new BookService());
    assert.deepEqual(await service.getAll(), books);
  } finally { injector.destroy(); }
});
