import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { asPromise } from '../utils';

export interface GithubRelease {
  tag_name: string;
  html_url: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private http = inject(HttpClient);

  getLatestRelease(): Promise<GithubRelease> {
    return asPromise(
      this.http.get<GithubRelease>(
        'https://api.github.com/repos/bolorundurowb/atheneum/releases/latest',
        { headers: { Accept: 'application/vnd.github+json' } }
      )
    );
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
