import { environment } from '../../environments/environment';

export function isApiRequest(url: string): boolean {
  const baseUrl = new URL(environment.baseApiUrl, window.location.origin);
  const requestUrl = new URL(url, window.location.origin);
  const basePath = baseUrl.pathname.replace(/\/$/, '');

  return requestUrl.origin === baseUrl.origin && (
    requestUrl.pathname === basePath || requestUrl.pathname.startsWith(`${basePath}/`)
  );
}
