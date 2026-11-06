import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { asPromise } from '../utils';

export interface GithubRelease {
  tag_name: string;
  html_url: string;
}

export class GithubRateLimitError extends Error {
  constructor(public retryAt: number) {
    super('GitHub is temporarily limiting update checks.');
    this.name = 'GithubRateLimitError';
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private http = inject(HttpClient);
  private readonly rateLimitStorageKey = 'atheneum.updateCheck.retryAt';

  async getLatestRelease(): Promise<GithubRelease> {
    const storedRetryAt = this.getStoredRetryAt();
    if (storedRetryAt > Date.now()) {
      throw new GithubRateLimitError(storedRetryAt);
    }

    try {
      return await asPromise(this.http.get<GithubRelease>(
        'https://api.github.com/repos/bolorundurowb/atheneum/releases/latest',
        { headers: { Accept: 'application/vnd.github+json' } }
      ));
    } catch (error) {
      if (error instanceof HttpErrorResponse && this.isRateLimited(error)) {
        const retryAt = this.getRetryAt(error);
        this.storeRetryAt(retryAt);
        throw new GithubRateLimitError(retryAt);
      }
      throw error;
    }
  }

  private isRateLimited(error: HttpErrorResponse): boolean {
    if (error.status === 429) return true;
    if (error.status !== 403) return false;

    const remaining = error.headers.get('X-RateLimit-Remaining');
    const message = JSON.stringify(error.error || '').toLowerCase();
    return remaining === '0' || message.includes('rate limit');
  }

  private getRetryAt(error: HttpErrorResponse): number {
    const retryAfter = Number(error.headers.get('Retry-After'));
    if (retryAfter > 0) return Date.now() + retryAfter * 1000;

    const resetAt = Number(error.headers.get('X-RateLimit-Reset')) * 1000;
    if (resetAt > Date.now()) return resetAt;

    return Date.now() + 60 * 60 * 1000;
  }

  private getStoredRetryAt(): number {
    try {
      return Number(localStorage.getItem(this.rateLimitStorageKey)) || 0;
    } catch {
      return 0;
    }
  }

  private storeRetryAt(retryAt: number): void {
    try {
      localStorage.setItem(this.rateLimitStorageKey, String(retryAt));
    } catch {
      // An unavailable storage backend should not prevent checking for updates.
    }
  }

  isNewerVersion(latest: string, current: string): boolean {
    const parse = (version: string) =>
      version.replace(/^v/i, '').split(/[+-]/)[0].split('.').map(Number);
    const latestParts = parse(latest);
    const currentParts = parse(current);
    for (let index = 0; index < Math.max(latestParts.length, currentParts.length); index++) {
      const difference = (latestParts[index] || 0) - (currentParts[index] || 0);
      if (difference !== 0) return difference > 0;
    }
    return false;
  }
}
