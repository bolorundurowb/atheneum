import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { GithubRateLimitError, UpdateService } from '../services/update.service';
import { authInterceptor } from './auth.interceptors';
import { errorInterceptor } from './error.interceptor';

describe('API authentication boundaries', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: AuthService;
  const releaseUrl = 'https://api.github.com/repos/bolorundurowb/atheneum/releases/latest';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    auth.persistUser({ authToken: 'test-token' });
    localStorage.removeItem('atheneum.updateCheck.retryAt');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    auth.logout();
    localStorage.removeItem('atheneum.updateCheck.retryAt');
    http.verify();
  });

  it('authenticates profile requests', () => {
    const url = `${environment.baseApiUrl}/v1/users/current`;
    client.get(url).subscribe();
    const request = http.expectOne(url);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ firstName: 'Reader' });
  });

  it('keeps the session when the settings update check returns 401', async () => {
    const result = TestBed.inject(UpdateService).getLatestRelease();
    const assertion = expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    const request = http.expectOne(releaseUrl);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });
    await assertion;
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getToken()).toBe('test-token');
  });

  it('preserves GitHub rate-limit details for the update service', async () => {
    const result = TestBed.inject(UpdateService).getLatestRelease();
    const assertion = expect(result).rejects.toBeInstanceOf(GithubRateLimitError);
    http.expectOne(releaseUrl).flush({ message: 'API rate limit exceeded' }, {
      status: 403,
      statusText: 'Forbidden',
      headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': '60' }
    });
    await assertion;
    expect(auth.isLoggedIn()).toBe(true);
  });

  it('does not send credentials to a host that merely starts with the API URL', () => {
    const baseUrl = new URL(environment.baseApiUrl);
    const url = `${baseUrl.protocol}//${baseUrl.hostname}.example.com/v1/users/current`;
    client.get(url).subscribe();
    const request = http.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('still logs out and redirects when the API rejects the session', () => {
    const url = `${environment.baseApiUrl}/v1/users/current`;
    const onError = vi.fn();
    client.get(url).subscribe({ error: onError });
    const request = http.expectOne(url);
    const location = { href: '' };
    vi.stubGlobal('window', { location });
    request.flush({ message: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
    expect(location.href).toBe('/auth/login');
    expect(onError).toHaveBeenCalledWith('Session expired');
  });
});
