/**
 * Created by bolorundurowb on 1/2/2021
 */

import { Injectable } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { GoogleIsbnService } from './google-isbn.service';
import { OpenLibraryIsbnService } from './open-library-isbn.service';
import { ArchiveIsbnService } from './archive-isbn.service';
import { WikidataIsbnService } from './wikidata-isbn.service';
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
    private archiveIsbnService: ArchiveIsbnService,
    private wikidataIsbnService: WikidataIsbnService
  ) {
    this.providers = [
      this.googleIsbnService,
      this.openLibIsbnService,
      this.archiveIsbnService,
      this.wikidataIsbnService
    ];
  }

  async getBookByIsbn(isbn: string): Promise<IsbnLookupResult> {
    const attemptedSources: string[] = [];

    for (const provider of this.providers) {
      attemptedSources.push(provider.name);

      const book = await provider.search(isbn);

      if (book) {
        return { book, source: provider.name, attemptedSources };
      }
    }

    return { book: null, source: null, attemptedSources };
  }
}
