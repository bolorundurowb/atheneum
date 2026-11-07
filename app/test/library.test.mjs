import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { LibraryPage } from '../src/app/tabs/library/library.page.ts';
import { AuthorService, BookService, NotificationService, PublisherService } from '../src/app/services/index.ts';

const book = id => ({ _id: String(id), title: `Book ${id}`, authors: [] });
const pageOfBooks = () => Array.from({ length: 50 }, (_, index) => book(index));

function setup(t) {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const calls = [];
  const errors = [];
  const injector = createEnvironmentInjector([
    { provide: BookService, useValue: { getAll$: (...args) => new Observable(observer => {
      const call = {
        args, closed: false,
        resolve: books => { observer.next(books); observer.complete(); },
        reject: error => observer.error(error)
      };
      calls.push(call);
      return () => { call.closed = true; };
    }) } },
    { provide: AuthorService, useValue: { getAll: async () => [] } },
    { provide: PublisherService, useValue: { getAll: async () => [] } },
    { provide: NotificationService, useValue: { error: async error => { errors.push(error); } } },
    { provide: NavController, useValue: {} }
  ], null);
  t.after(() => { if (!injector.destroyed) injector.destroy(); });
  const page = runInInjectionContext(injector, () => new LibraryPage());
  page.ngOnInit();
  t.mock.timers.tick(1);
  return { page, calls, errors, injector, tick: ms => t.mock.timers.tick(ms) };
}

function completionEvent() {
  const state = { count: 0 };
  return { state, target: { complete: async () => { state.count++; } } };
}

test('debounces typing, cancels immediately, ignores stale responses and duplicate values', t => {
  const { page, calls, tick } = setup(t);
  assert.equal(calls.length, 1);
  page.handleSearch('first');
  assert.equal(calls[0].closed, true);
  tick(150);
  page.handleSearch('second');
  tick(299);
  assert.equal(calls.length, 1);
  tick(1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args[2], 'second');
  calls[1].resolve([book('new')]);
  calls[0].resolve([book('old')]);
  assert.deepEqual(page.books, [book('new')]);
  assert.equal(page.isLoading, false);
  page.handleSearch(' second ');
  tick(300);
  assert.equal(calls.length, 2);
});

test('stops after an empty page when the total is an exact multiple of the limit', t => {
  const { page, calls, tick } = setup(t);
  calls[0].resolve(pageOfBooks());
  assert.equal(page.hasMore, true);
  const first = completionEvent();
  page.handleScrollEnd(first);
  const duplicate = completionEvent();
  page.handleScrollEnd(duplicate);
  assert.equal(duplicate.state.count, 1);
  tick(1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args[0], 50);
  calls[1].resolve([]);
  assert.equal(first.state.count, 1);
  assert.equal(page.hasMore, false);
  const exhausted = completionEvent();
  page.handleScrollEnd(exhausted);
  tick(1);
  assert.equal(calls.length, 2);
  assert.equal(exhausted.state.count, 1);
});

test('retries a failed page without skipping books and stops on a partial page', t => {
  const { page, calls, errors, tick } = setup(t);
  calls[0].resolve(pageOfBooks());
  const failed = completionEvent();
  page.handleScrollEnd(failed);
  tick(1);
  calls[1].reject('network unavailable');
  assert.equal(failed.state.count, 1);
  assert.equal(page.currentPage, 1);
  assert.equal(page.isLoadingMore, false);
  assert.deepEqual(errors, ['network unavailable']);
  page.handleScrollEnd(completionEvent());
  tick(1);
  assert.equal(calls[2].args[0], 50);
  calls[2].resolve([book('last')]);
  assert.equal(page.books.length, 51);
  assert.equal(page.currentPage, 2);
  assert.equal(page.hasMore, false);
});

test('changing filters cancels pagination, applies all filters, and completes the scroll', t => {
  const { page, calls, tick } = setup(t);
  calls[0].resolve(pageOfBooks());
  const scroll = completionEvent();
  page.handleScrollEnd(scroll);
  tick(1);
  page.authorId = 'author-a';
  page.publisherId = 'publisher-a';
  page.yearFilter = '2020';
  page.handleFilter();
  assert.equal(calls[1].closed, true);
  assert.equal(scroll.state.count, 1);
  tick(1);
  assert.deepEqual(calls[2].args, [0, 50, '', 'publisher-a', 'author-a', 2020]);
  calls[2].resolve([book('filtered')]);
  calls[1].resolve([book('stale page')]);
  assert.deepEqual(page.books, [book('filtered')]);
  assert.equal(page.currentPage, 1);
});

test('refresh reloads an unchanged query, resets pagination, and completes after errors', t => {
  const { page, calls, tick, errors } = setup(t);
  calls[0].resolve(pageOfBooks());
  const refresh = completionEvent();
  page.handlePullRefresh(refresh);
  tick(1);
  assert.equal(calls[1].args[0], 0);
  calls[1].reject('refresh failed');
  assert.equal(refresh.state.count, 1);
  assert.equal(page.isLoading, false);
  assert.equal(page.hasMore, false);
  assert.deepEqual(errors, ['refresh failed']);
  const retry = completionEvent();
  page.handlePullRefresh(retry);
  tick(1);
  calls[2].resolve([book('fresh')]);
  assert.equal(retry.state.count, 1);
  assert.deepEqual(page.books, [book('fresh')]);
});

test('destroying the page cancels requests and pending debounce timers', t => {
  const { page, calls, injector, tick } = setup(t);
  page.handleSearch('pending');
  injector.destroy();
  tick(300);
  assert.equal(calls[0].closed, true);
  assert.equal(calls.length, 1);
});
