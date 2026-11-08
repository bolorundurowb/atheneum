import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ApplicationRef, ChangeDetectorRef, provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavController } from '@ionic/angular';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home.page';
import {
  AuthorService,
  AuthService,
  BookService,
  NotificationService,
  PublisherService,
  StatisticService
} from '../../services';

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<unknown>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup() {
  const requests = Array.from({ length: 4 }, deferred);
  const started: number[] = [];
  const errors: unknown[] = [];
  const request = (index: number) => {
    started.push(index);
    return requests[index].promise;
  };
  TestBed.configureTestingModule({
    providers: [
      provideNoopAnimations(),
      provideZoneChangeDetection(),
      { provide: ChangeDetectorRef, useValue: { markForCheck: () => undefined } },
      { provide: StatisticService, useValue: { get: () => request(0) } },
      { provide: AuthorService, useValue: { getTop: () => request(1) } },
      { provide: BookService, useValue: { getRecent: () => request(2) } },
      { provide: PublisherService, useValue: { getTop: () => request(3) } },
      { provide: AuthService, useValue: { getUser: () => ({ firstName: 'Reader' }) } },
      { provide: NotificationService, useValue: { error: async (error: unknown) => { errors.push(error); } } },
      { provide: NavController, useValue: {} }
    ]
  });
  const page = TestBed.runInInjectionContext(() => new HomePage());
  return { requests, started, errors, page };
}

describe('Dashboard loading', () => {
  it('starts all requests before any complete and waits for every result', async () => {
    const { page, requests, started } = setup();
    const load = page.ngOnInit();
    expect(started).toEqual([0, 1, 2, 3]);
    expect(page.isLoading).toBe(true);
    expect(page.currentUser).toEqual({ firstName: 'Reader' });
    requests[0].resolve({ books: 5 });
    requests[1].resolve([{ author: 'A' }]);
    requests[2].resolve([{ title: 'Book' }]);
    await requests[2].promise;
    expect(page.isLoading).toBe(true);
    requests[3].resolve([{ publisher: 'P' }]);
    await load;
    expect(page.isLoading).toBe(false);
    expect(page.stats).toEqual({ books: 5 });
    expect(page.recentBooks).toEqual([{ title: 'Book' }]);
    expect(page.topAuthors).toEqual([{ author: 'A' }]);
    expect(page.topPublishers).toEqual([{ publisher: 'P' }]);
  });

  it('keeps successful sections when another request fails and completes refresh', async () => {
    const { page, requests, errors } = setup();
    let completed = false;
    const refresh = page.handleRefresh({ target: { complete: () => { completed = true; } } });
    requests[0].reject('statistics unavailable');
    requests[1].resolve([]);
    requests[2].resolve([{ title: 'Book' }]);
    requests[3].resolve([]);
    await refresh;
    expect(page.recentBooks).toEqual([{ title: 'Book' }]);
    expect(errors).toEqual(['statistics unavailable']);
    expect(completed).toBe(true);
  });

  it('renders the dashboard after its requests settle', async () => {
    const { requests } = setup();
    const fixture = TestBed.createComponent(HomePage);
    fixture.autoDetectChanges();
    requests[0].resolve({ books: 5 });
    requests[1].resolve([]);
    requests[2].resolve([]);
    requests[3].resolve([]);
    await vi.waitFor(() => { expect(fixture.componentInstance.isLoading).toBe(false); });
    await fixture.whenStable();
    TestBed.inject(ApplicationRef).tick();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.page-title')?.textContent).toContain('reader.');
    expect(element.querySelector('.count')?.textContent).toContain('5');
    expect(element.querySelector('.page-loader')).toBeNull();
  });
});
