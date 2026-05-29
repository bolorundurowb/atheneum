/**
 * Created by bolorundurowb on 1/2/2021
 */

import { Injectable } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { GoogleIsbnService } from './google-isbn.service';
import { OpenLibraryIsbnService } from './open-library-isbn.service';

@Injectable()
export class IsbnService {
  constructor(
    private googleIsbnService: GoogleIsbnService,
    private openLibIsbnService: OpenLibraryIsbnService
  ) {}

  async getBookByIsbn(isbn: string): Promise<BookInfoDto> {
    let book;

    // first try to use the google books archive
    book = await this.googleIsbnService.search(isbn);

    // if book not found, try the open library service
    if (!book) {
      book = await this.openLibIsbnService.search(isbn);
    }

    return book;
  }
}
