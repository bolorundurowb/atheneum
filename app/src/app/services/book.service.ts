import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { asPromise } from '../utils';
import { firstValueFrom, Observable } from 'rxjs';
import { BookCard } from '../models/book';

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  private readonly baseUrl;

  constructor() {
    this.baseUrl = `${environment.baseApiUrl}/v1/books`;
  }

  getAll(skip = 0, limit = 50, search = '', publisherId = '', authorId = '', publishYear?: number): Promise<BookCard[]> {
    return firstValueFrom(this.getAll$(skip, limit, search, publisherId, authorId, publishYear));
  }

  getAll$(skip = 0, limit = 50, search = '', publisherId = '', authorId = '', publishYear?: number): Observable<BookCard[]> {
    const params = [
      `skip=${skip}`,
      `limit=${limit}`,
      `search=${encodeURIComponent(search)}`,
      `publisherId=${publisherId}`,
      `authorId=${authorId}`
    ];

    if (publishYear) {
      params.push(`publishYear=${publishYear}`);
    }

    return this.http.get<BookCard[]>(`${this.baseUrl}?${params.join('&')}`);
  }

  getRecent(): Promise<any[]> {
    return asPromise<any[]>(this.http.get<any>(`${this.baseUrl}/recent`));
  }

  createByIsbn(payload: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/isbn`, payload));
  }

  createManually(payload: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/manual`, payload));
  }

  uploadCover(image: string): Promise<{ url: string }> {
    return asPromise(
      this.http.post<{ url: string }>(`${this.baseUrl}/cover`, { image })
    );
  }

  logOcrFailure(payload: { reason: string; confidence?: number }): Promise<any> {
    return asPromise(
      this.http.post<any>(`${this.baseUrl}/ocr-failures`, payload)
    );
  }

  removeBook(bookId: any): Promise<any> {
    return asPromise(this.http.delete<any>(`${this.baseUrl}/${bookId}`));
  }

  getBook(bookId: string): Promise<any> {
    return asPromise<any>(this.http.get<any>(`${this.baseUrl}/${bookId}`));
  }

  borrowBook(bookId: string, borrowerName: string): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/${bookId}/borrow`, { borrowerName }));
  }

  returnBook(bookId: string): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/${bookId}/return`, {}));
  }
}
