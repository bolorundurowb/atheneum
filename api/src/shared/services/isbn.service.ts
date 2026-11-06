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
    const attemptedSources: string[] = [];

    for (const provider of this.providers) {
      attemptedSources.push(provider.name);

      // Keep one failing provider from preventing the remaining sources from running.
      let book: BookInfoDto;
      try {
        book = await provider.search(isbn);
      } catch {
        book = null;
      }

      if (book) {
        return { book, source: provider.name, attemptedSources };
      }
    }

    return { book: null, source: null, attemptedSources };
  }
}
