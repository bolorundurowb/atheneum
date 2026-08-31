import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { IsbnProvider } from './isbn-provider.interface';

@Injectable()
export class ArchiveIsbnService implements IsbnProvider {
  readonly name = 'Internet Archive';

  private readonly baseUrl = 'https://archive.org';
  private readonly logger = new Logger(ArchiveIsbnService.name);

  constructor(private httpService: HttpService) {}

  async search(isbn: string): Promise<BookInfoDto> {
    try {
      const query = `isbn:${isbn} AND mediatype:texts`;
      const url =
        `${this.baseUrl}/advancedsearch.php?q=${encodeURIComponent(query)}` +
        `&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=publisher` +
        `&fl%5B%5D=date&fl%5B%5D=isbn&fl%5B%5D=description&rows=1&output=json`;

      const response = await this.httpService.get<any>(url).toPromise();
      const data = response?.data?.response?.docs?.[0];

      if (!data) {
        return null;
      }

      const isbns: string[] = data.isbn || [];
      const isbn10 = isbns.find((x) => x?.length === 10);
      const isbn13 = isbns.find((x) => x?.length === 13);

      this.logger.log(
        'Successfully retrieved external book info from the Internet Archive.'
      );

      return {
        externalId: data.identifier,
        title: data.title,
        authors: this.cleanAuthors(data.creator || []),
        publisher: this.cleanPublisher(data.publisher),
        publishYear: data.date ? new Date(data.date).getFullYear() : 0,
        summary: data.description,
        isbn: isbn10,
        isbn13: isbn13,
        coverArt: `${this.baseUrl}/services/img/${data.identifier}`,
        pageCount: undefined,
        source: this.name
      };
    } catch (err) {
      this.logger.error(
        'An error occurred when retrieving external book info from the Internet Archive.',
        err
      );

      return null;
    }
  }

  private cleanAuthors(creators: string[]): string[] {
    const cleaned = creators
      .filter((x) => x)
      .map((x) => x.replace(/,\s*\d{3,4}[-\s].*$/, '').trim())
      .filter((x) => x);

    return cleaned.length ? cleaned : ['No Author'];
  }

  private cleanPublisher(publisher?: string): string | undefined {
    if (!publisher) {
      return undefined;
    }

    const parts = publisher.split(' : ');
    return (parts[parts.length - 1] || publisher).trim();
  }
}
