/**
 * Created by bolorundurowb on 7/23/2021
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';

@Injectable()
export class OpenLibraryIsbnService {
  private readonly baseUrl = 'https://openlibrary.org';
  private readonly baseIsbnUrl = `${this.baseUrl}/isbn`;
  private readonly baseCoverUrl = 'https://covers.openlibrary.org/b/id/';
  private readonly logger = new Logger(OpenLibraryIsbnService.name);

  constructor(private httpService: HttpService) {}

  async search(isbn: string): Promise<BookInfoDto> {
    try {
      const response = await this.httpService
        .get<any>(`${this.baseIsbnUrl}/${isbn}.json`)
        .toPromise();
      const data = response?.data;

      if (!data) {
        return null;
      }

      const bookInfo: any = {
        externalId: data.key,
        publisher: data.publishers[0],
        publishYear: new Date(data.publish_date).getFullYear(),
        summary: data.first_sentence,
        title: data.title,
        isbn: data.isbn_10[0],
        isbn13: data.isbn_13[0],
        pageCount: data.number_of_pages,
        source: 'Open Library'
      };

      bookInfo.authors = await this.authorDetails(
        data.authors?.map((x) => x.key)
      );

      if (data.covers && data.covers[0]) {
        bookInfo.coverArt = `${this.baseCoverUrl}${data.covers[0]}-L.jpg`;
      } else {
        bookInfo.coverArt = undefined;
      }

      this.logger.log(
        'Successfully retrieved external book info from the Open Library.'
      );

      return bookInfo;
    } catch (err) {
      const { message, status, code, response } = err;
      this.logger.error(
        'An error occurred when retrieving external book info from the Open Library.',
        {
          message,
          status,
          code,
          statusText: response?.statusText,
          internalError: response?.data?.error?.message
        }
      );

      return null;
    }
  }

  private async authorDetails(authorIds?: Array<string>): Promise<Array<any>> {
    if (!authorIds?.length) {
      return [];
    }

    const authors = await Promise.all(
      authorIds.map((x) =>
        this.httpService.get<any>(`${this.baseUrl}${x}.json`).toPromise()
      )
    );
    return authors.map((x) => x.data?.name);
  }
}
