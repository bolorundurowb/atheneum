import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { asPromise } from '../utils';

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  private readonly baseUrl;

  constructor() {
    this.baseUrl = `${environment.baseApiUrl}/v1/books`;
  }

  getAll(skip = 0, limit = 50, search = '', publisherId = '', authorId = '', publishYear?: number): Promise<any[]> {
    const params = [
      `skip=${skip}`,
      `limit=${limit}`,
      `search=${search}`,
      `publisherId=${publisherId}`,
      `authorId=${authorId}`
    ];

    if (publishYear) {
      params.push(`publishYear=${publishYear}`);
    }

    return asPromise<any[]>(this.http.get<any>(`${this.baseUrl}?${params.join('&')}`));
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