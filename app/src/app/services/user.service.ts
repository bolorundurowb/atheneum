import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { asPromise } from '../utils';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  private readonly baseUrl;

  constructor() {
    this.baseUrl = `${environment.baseApiUrl}/v1/users`;
  }

  getProfile(): Promise<any> {
    return asPromise(this.http.get<any>(`${this.baseUrl}/current`));
  }

  updateProfile(payload: any): Promise<any> {
    return asPromise(this.http.put<any>(`${this.baseUrl}/current`, payload));
  }

  updatePassword(payload: any): Promise<any> {
    return asPromise(this.http.put<any>(`${this.baseUrl}/current/passwords`, payload));
  }
}
