import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { asPromise } from '../utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  userKey = 'atheneum-user';
  private readonly baseUrl;

  constructor() {
    this.baseUrl = `${environment.baseApiUrl}/v1/auth`;
  }

  login(user: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/login`, user));
  }

  register(user: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/register`, user));
  }

  forgotPassword(payload: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/forgot-password`, payload));
  }

  resetPassword(payload: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/reset-password`, payload));
  }

  verifyEmail(payload: any): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/verify-email`, payload));
  }

  resendVerificationCode(): Promise<any> {
    return asPromise(this.http.post<any>(`${this.baseUrl}/resend-verification-code`, {}));
  }

  isLoggedIn() {
    return !!localStorage.getItem(this.userKey);
  }

  logout() {
    localStorage.removeItem(this.userKey);
  }

  persistUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): any {
    return JSON.parse(localStorage.getItem(this.userKey)!);
  }

  getToken(): string {
    return this.getUser().authToken;
  }
}
