import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { asPromise } from '../utils';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private http = inject(HttpClient);

  private readonly baseUrl;

  constructor() {
    this.baseUrl = `${environment.baseApiUrl}/v1/authors`;
  }

  getTop(): Promise<any[]> {
    return asPromise<any[]>(this.http.get<any>(`${this.baseUrl}/top`));
  }
}
