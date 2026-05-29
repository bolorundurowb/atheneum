/**
 * Created by bolorundurowb on 7/23/2021
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';

@Injectable()
export class GoogleIsbnService {
  private readonly baseUrl =
    'https://www.googleapis.com/books/v1/volumes?q=isbn:';
  private readonly logger = new Logger(GoogleIsbnService.name);

  constructor(private httpService: HttpService) {}

  async search(isbn: string): Promise<BookInfoDto> {
    try {
      const response = await this.httpService
        .get<any>(`${this.baseUrl}${isbn}`)
        .toPromise();
      const items = response.data?.items || [];
      const data = items[0];

      if (!data) {
        return null;
      }

      this.logger.log('Successfully retrieved external book info from Google.');

      const volInfo = data.volumeInfo;
      return {
        externalId: data.id,
        authors: volInfo.authors || ['No Author'],
        publisher: volInfo.publisher,
        publishYear:
          volInfo.publishedDate && /^\d+$/.test(volInfo.publishedDate)
            ? +volInfo.publishedDate
            : 0,
        summary: volInfo.description,
        title: volInfo.title,
        isbn: volInfo.industryIdentifiers.filter((x) => x.type === 'ISBN_10')[0]
          ?.identifier,
        isbn13: volInfo.industryIdentifiers.filter(
          (x) => x.type === 'ISBN_13'
        )[0]?.identifier,
        coverArt: volInfo.imageLinks?.thumbnail,
        pageCount: volInfo.pageCount,
        source: 'Google Books'
      };
    } catch (err) {
      const { message, status, code, response } = err;
      this.logger.error(
        'An error occurred when retrieving external book info from Google.',
        {
          message,
          status,
          code,
          statusText: response?.statusText,
          internalError: response?.data?.error?.message,
        }
      );

      return null;
    }
  }
}
