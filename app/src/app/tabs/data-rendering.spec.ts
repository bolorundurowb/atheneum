import { ApplicationRef, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NavController } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationService } from '../services';
import { LibraryPage } from './library/library.page';
import { WishlistPage } from './wishlist/wishlist.page';

describe('Tab rendering after HTTP responses', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideZoneChangeDetection(),
        { provide: NavController, useValue: {} },
        { provide: NotificationService, useValue: { error: async () => undefined } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('replaces the library spinner with books after the list response', async () => {
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.autoDetectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.page-loader')).not.toBeNull();
    http.expectOne(request => request.url.endsWith('/v1/authors')).flush([]);
    http.expectOne(request => request.url.endsWith('/v1/publishers')).flush([]);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    http.expectOne(request => request.url.includes('/v1/books?')).flush([
      { _id: 'book-a', title: 'Library response', authors: [] }
    ]);
    await fixture.whenStable();
    TestBed.inject(ApplicationRef).tick();
    expect(element.querySelector('.page-loader')).toBeNull();
    expect(element.querySelector('app-book .title')?.textContent).toContain('Library response');
  });

  it('replaces the wishlist spinner and renders refreshed responses', async () => {
    const fixture = TestBed.createComponent(WishlistPage);
    fixture.autoDetectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.page-loader')).not.toBeNull();
    http.expectOne(request => request.url.endsWith('/v1/wish-list')).flush([
      { _id: 'wish-a', title: 'Wishlist response', authorName: 'Example author' }
    ]);
    await fixture.whenStable();
    TestBed.inject(ApplicationRef).tick();
    expect(element.querySelector('.page-loader')).toBeNull();
    expect(element.querySelector('app-book .title')?.textContent).toContain('Wishlist response');

    const refresh = fixture.componentInstance.loadData();
    http.expectOne(request => request.url.endsWith('/v1/wish-list')).flush([
      { _id: 'wish-b', title: 'Updated wishlist', authorName: 'Example author' }
    ]);
    await refresh;
    TestBed.inject(ApplicationRef).tick();
    expect(element.querySelector('app-book .title')?.textContent).toContain('Updated wishlist');
  });
});
