/**
 * Created by bolorundurowb on 7/23/2021
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { IsbnProvider } from './isbn-provider.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleIsbnService implements IsbnProvider {
  readonly name = 'Google Books';

  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  private readonly logger = new Logger(GoogleIsbnService.name);

  constructor(
    private httpService: HttpService,
    private config: ConfigService
  ) {}

  async search(isbn: string, signal?: AbortSignal): Promise<BookInfoDto> {
    try {
      const response = await this.httpService
        .get<any>(this.baseUrl, {
          params: {
            q: `isbn:${isbn}`,
            key: this.config.get<string>('googleBooks.apiKey') || undefined
          },
          signal,
          timeout: 5000
        })
        .toPromise();
      const items = response.data?.items || [];
      const data = items[0];

      if (!data) {
        return null;
      }

      this.logger.log('Successfully retrieved external book info from Google.');

      const volInfo = data.volumeInfo || {};
      const identifiers = volInfo.industryIdentifiers || [];
      return {
        externalId: data.id,
        authors: volInfo.authors || ['No Author'],
        publisher: volInfo.publisher,
        publishYear: this.getYear(volInfo.publishedDate),
        summary: volInfo.description,
        title: volInfo.title,
        isbn: identifiers.find((x) => x.type === 'ISBN_10')?.identifier,
        isbn13: identifiers.find((x) => x.type === 'ISBN_13')?.identifier,
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
          internalError: response?.data?.error?.message
        }
      );

      return null;
    }
  }

  private getYear(date?: string): number {
    const year = date?.match(/\b[12]\d{3}\b/)?.[0];
    return year ? Number(year) : 0;
  }
}
