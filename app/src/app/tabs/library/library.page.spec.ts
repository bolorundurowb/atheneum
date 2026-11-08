import { TestBed } from '@angular/core/testing';
import { InfiniteScrollCustomEvent, NavController, RefresherCustomEvent } from '@ionic/angular';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LibraryPage } from './library.page';
import { AuthorService, BookService, NotificationService, PublisherService } from '../../services';
import { BookCard } from '../../models/book';

const book = (id: string | number): BookCard => ({ _id: String(id), title: `Book ${id}`, authors: [] });
const pageOfBooks = () => Array.from({ length: 50 }, (_, index) => book(index));

interface ListCall {
  args: Parameters<BookService['getAll$']>;
  closed: boolean;
  resolve(books: BookCard[]): void;
  reject(error: unknown): void;
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
afterEach(() => {
  TestBed.resetTestingModule();
  vi.useRealTimers();
});

function setup() {
  const calls: ListCall[] = [];
  const errors: unknown[] = [];
  TestBed.configureTestingModule({ providers: [
    { provide: BookService, useValue: { getAll$: (...args: Parameters<BookService['getAll$']>) => new Observable<BookCard[]>(observer => {
      const call: ListCall = {
        args, closed: false,
        resolve: books => { observer.next(books); observer.complete(); },
        reject: error => observer.error(error)
      };
      calls.push(call);
      return () => { call.closed = true; };
    }) } },
    { provide: AuthorService, useValue: { getAll: async () => [] } },
    { provide: PublisherService, useValue: { getAll: async () => [] } },
    { provide: NotificationService, useValue: { error: async (error: unknown) => { errors.push(error); } } },
    { provide: NavController, useValue: {} }
  ] });
  const page = TestBed.runInInjectionContext(() => new LibraryPage());
  page.ngOnInit();
  vi.advanceTimersByTime(1);
  return { page, calls, errors, tick: (ms: number) => vi.advanceTimersByTime(ms) };
}

type ScrollEvent = InfiniteScrollCustomEvent & { state: { count: number } };
type RefreshEvent = RefresherCustomEvent & { state: { count: number } };

function completionEvent(kind?: 'scroll'): ScrollEvent;
function completionEvent(kind: 'refresh'): RefreshEvent;
function completionEvent(kind: 'scroll' | 'refresh' = 'scroll'): ScrollEvent | RefreshEvent {
  const state = { count: 0 };
  const target = kind === 'scroll' ? document.createElement('ion-infinite-scroll') : document.createElement('ion-refresher');
  target.complete = async () => { state.count++; };
  const event = new CustomEvent(kind === 'scroll' ? 'ionInfinite' : 'ionRefresh');
  Object.defineProperty(event, 'target', { value: target });
  return Object.assign(event, { state }) as ScrollEvent | RefreshEvent;
}

it('debounces typing, cancels immediately, ignores stale responses and duplicate values', () => {
  const { page, calls, tick } = setup();
  expect(calls.length).toBe(1);
  page.handleSearch('first');
  expect(calls[0].closed).toBe(true);
  tick(150);
  page.handleSearch('second');
  tick(299);
  expect(calls.length).toBe(1);
  tick(1);
  expect(calls.length).toBe(2);
  expect(calls[1].args[2]).toBe('second');
  calls[1].resolve([book('new')]);
  calls[0].resolve([book('old')]);
  expect(page.books).toEqual([book('new')]);
  expect(page.isLoading).toBe(false);
  page.handleSearch(' second ');
  tick(300);
  expect(calls.length).toBe(2);
});

it('stops after an empty page when the total is an exact multiple of the limit', () => {
  const { page, calls, tick } = setup();
  calls[0].resolve(pageOfBooks());
  expect(page.hasMore).toBe(true);
  const first = completionEvent();
  page.handleScrollEnd(first);
  const duplicate = completionEvent();
  page.handleScrollEnd(duplicate);
  expect(duplicate.state.count).toBe(1);
  tick(1);
  expect(calls.length).toBe(2);
  expect(calls[1].args[0]).toBe(50);
  calls[1].resolve([]);
  expect(first.state.count).toBe(1);
  expect(page.hasMore).toBe(false);
  const exhausted = completionEvent();
  page.handleScrollEnd(exhausted);
  tick(1);
  expect(calls.length).toBe(2);
  expect(exhausted.state.count).toBe(1);
});

it('retries a failed page without skipping books and stops on a partial page', () => {
  const { page, calls, errors, tick } = setup();
  calls[0].resolve(pageOfBooks());
  const failed = completionEvent();
  page.handleScrollEnd(failed);
  tick(1);
  calls[1].reject('network unavailable');
  expect(failed.state.count).toBe(1);
  expect(page.currentPage).toBe(1);
  expect(page.isLoadingMore).toBe(false);
  expect(errors).toEqual(['network unavailable']);
  page.handleScrollEnd(completionEvent());
  tick(1);
  expect(calls[2].args[0]).toBe(50);
  calls[2].resolve([book('last')]);
  expect(page.books.length).toBe(51);
  expect(page.currentPage).toBe(2);
  expect(page.hasMore).toBe(false);
});

it('changing filters cancels pagination, applies all filters, and completes the scroll', () => {
  const { page, calls, tick } = setup();
  calls[0].resolve(pageOfBooks());
  const scroll = completionEvent();
  page.handleScrollEnd(scroll);
  tick(1);
  page.authorId = 'author-a';
  page.publisherId = 'publisher-a';
  page.yearFilter = '2020';
  page.handleFilter();
  expect(calls[1].closed).toBe(true);
  expect(scroll.state.count).toBe(1);
  tick(1);
  expect(calls[2].args).toEqual([0, 50, '', 'publisher-a', 'author-a', 2020]);
  calls[2].resolve([book('filtered')]);
  calls[1].resolve([book('stale page')]);
  expect(page.books).toEqual([book('filtered')]);
  expect(page.currentPage).toBe(1);
});

it('refresh reloads an unchanged query, resets pagination, and completes after errors', () => {
  const { page, calls, tick, errors } = setup();
  calls[0].resolve(pageOfBooks());
  const refresh = completionEvent('refresh');
  page.handlePullRefresh(refresh);
  tick(1);
  expect(calls[1].args[0]).toBe(0);
  calls[1].reject('refresh failed');
  expect(refresh.state.count).toBe(1);
  expect(page.isLoading).toBe(false);
  expect(page.hasMore).toBe(false);
  expect(errors).toEqual(['refresh failed']);
  const retry = completionEvent('refresh');
  page.handlePullRefresh(retry);
  tick(1);
  calls[2].resolve([book('fresh')]);
  expect(retry.state.count).toBe(1);
  expect(page.books).toEqual([book('fresh')]);
});

it('destroying the page cancels requests and pending debounce timers', () => {
  const { page, calls, tick } = setup();
  page.handleSearch('pending');
  TestBed.resetTestingModule();
  tick(300);
  expect(calls[0].closed).toBe(true);
  expect(calls.length).toBe(1);
});
