import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { NavController } from '@ionic/angular';
import { HomePage } from '../src/app/tabs/home/home.page.ts';
import { AuthorService, AuthService, BookService, NotificationService, PublisherService, StatisticService } from '../src/app/services/index.ts';

function setup() {
  const requests = Array.from({ length: 4 }, () => Promise.withResolvers());
  const started = [];
  const errors = [];
  const request = index => { started.push(index); return requests[index].promise; };
  const injector = createEnvironmentInjector([
    { provide: StatisticService, useValue: { get: () => request(0) } },
    { provide: AuthorService, useValue: { getTop: () => request(1) } },
    { provide: BookService, useValue: { getRecent: () => request(2) } },
    { provide: PublisherService, useValue: { getTop: () => request(3) } },
    { provide: AuthService, useValue: { getUser: () => ({ firstName: 'Reader' }) } },
    { provide: NotificationService, useValue: { error: async error => { errors.push(error); } } },
    { provide: NavController, useValue: {} }
  ], null);
  const page = runInInjectionContext(injector, () => new HomePage());
  return { requests, started, errors, page, injector };
}

test('starts all dashboard requests before any complete and waits for all results', async () => {
  const { page, injector, requests, started } = setup();
  try {
    const load = page.ngOnInit();
    assert.deepEqual(started, [0, 1, 2, 3]);
    assert.equal(page.isLoading, true);
    assert.deepEqual(page.currentUser, { firstName: 'Reader' });
    requests[0].resolve({ books: 5 });
    requests[1].resolve([{ author: 'A' }]);
    requests[2].resolve([{ title: 'Book' }]);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(page.isLoading, true);
    requests[3].resolve([{ publisher: 'P' }]);
    await load;
    assert.equal(page.isLoading, false);
    assert.deepEqual(page.stats, { books: 5 });
    assert.deepEqual(page.recentBooks, [{ title: 'Book' }]);
    assert.deepEqual(page.topAuthors, [{ author: 'A' }]);
    assert.deepEqual(page.topPublishers, [{ publisher: 'P' }]);
  } finally { injector.destroy(); }
});

test('keeps successful sections when another request fails and completes refresh', async () => {
  const { page, injector, requests, errors } = setup();
  let completed = false;
  try {
    const refresh = page.handleRefresh({ target: { complete: () => { completed = true; } } });
    requests[0].reject('statistics unavailable');
    requests[1].resolve([]);
    requests[2].resolve([{ title: 'Book' }]);
    requests[3].resolve([]);
    await refresh;
    assert.deepEqual(page.recentBooks, [{ title: 'Book' }]);
    assert.deepEqual(errors, ['statistics unavailable']);
    assert.equal(completed, true);
  } finally { injector.destroy(); }
});
