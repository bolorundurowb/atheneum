/**
 * Created by bolorundurowb on 1/2/2021
 */

import { Injectable } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { GoogleIsbnService } from './google-isbn.service';
import { OpenLibraryIsbnService } from './open-library-isbn.service';
import { ArchiveIsbnService } from './archive-isbn.service';
import { IsbnProvider } from './isbn-provider.interface';

export interface IsbnLookupResult {
  book: BookInfoDto;
  source: string;
  attemptedSources: string[];
}

@Injectable()
export class IsbnService {
  private readonly providers: IsbnProvider[];
  private readonly cache = new Map<
    string,
    { result: IsbnLookupResult; expiresAt: number }
  >();
  private readonly pending = new Map<string, Promise<IsbnLookupResult>>();
  private readonly cacheTtlMs = 60 * 60 * 1000;
  private readonly maxEntries = 1000;
  private readonly providerTimeoutMs = 5000;
  private readonly lookupTimeoutMs = 15000;

  constructor(
    private googleIsbnService: GoogleIsbnService,
    private openLibIsbnService: OpenLibraryIsbnService,
    private archiveIsbnService: ArchiveIsbnService
  ) {
    this.providers = [
      this.googleIsbnService,
      this.openLibIsbnService,
      this.archiveIsbnService
    ];
  }

  async getBookByIsbn(isbn: string): Promise<IsbnLookupResult> {
    const key = isbn.replace(/[\s-]/g, '').toUpperCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return structuredClone(cached.result);
    }
    this.cache.delete(key);

    let lookup = this.pending.get(key);
    if (lookup === undefined) {
      lookup = this.lookup(key).then((result) => {
        if (result.book) {
          if (this.cache.size >= this.maxEntries) {
            this.cache.delete(this.cache.keys().next().value);
          }
          this.cache.set(key, {
            result,
            expiresAt: Date.now() + this.cacheTtlMs
          });
        }
        return result;
      });
      if (this.pending.size < this.maxEntries) {
        this.pending.set(key, lookup);
      }
    }

    try {
      // Callers enrich book metadata when saving; never share that mutable object.
      return structuredClone(await lookup);
    } finally {
      if (this.pending.get(key) === lookup) {
        this.pending.delete(key);
      }
    }
  }

  private async lookup(isbn: string): Promise<IsbnLookupResult> {
    const attemptedSources: string[] = [];
    const deadline = Date.now() + this.lookupTimeoutMs;

    for (const provider of this.providers) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      attemptedSources.push(provider.name);
      const book = await this.searchWithTimeout(
        provider,
        isbn,
        Math.min(remaining, this.providerTimeoutMs)
      );

      if (book) {
        return { book, source: provider.name, attemptedSources };
      }
    }

    return { book: null, source: null, attemptedSources };
  }

  private async searchWithTimeout(
    provider: IsbnProvider,
    isbn: string,
    timeoutMs: number
  ): Promise<BookInfoDto | null> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        provider.search(isbn, controller.signal),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => {
            controller.abort();
            resolve(null);
          }, timeoutMs);
        })
      ]);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
