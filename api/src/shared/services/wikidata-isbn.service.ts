import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BookInfoDto } from '../../books/dtos/book-info.dto';
import { IsbnProvider } from './isbn-provider.interface';

@Injectable()
export class WikidataIsbnService implements IsbnProvider {
  readonly name = 'Wikidata';

  private readonly baseUrl = 'https://query.wikidata.org/sparql';
  private readonly logger = new Logger(WikidataIsbnService.name);

  constructor(private httpService: HttpService) {}

  async search(isbn: string): Promise<BookInfoDto> {
    try {
      const normalized = isbn.replace(/[-\s]/g, '');
      const query = [
        'SELECT ?item ?itemLabel ?authorLabel ?publisherLabel ?pubDate ?pageCount ?description WHERE {',
        '  { ?item wdt:P212 ?isbn. } UNION { ?item wdt:P957 ?isbn. }',
        `  FILTER(REPLACE(?isbn, "-", "") = "${normalized}")`,
        '  OPTIONAL { ?item wdt:P50 ?author. }',
        '  OPTIONAL { ?item wdt:P123 ?publisher. }',
        '  OPTIONAL { ?item wdt:P577 ?pubDate. }',
        '  OPTIONAL { ?item wdt:P1104 ?pageCount. }',
        '  OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") }',
        '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }',
        '} LIMIT 50'
      ].join('\n');

      const response = await this.httpService
        .get<any>(this.baseUrl, {
          params: { query, format: 'json' },
          headers: {
            'User-Agent': 'Atheneum/2.0 (book cataloguing app)',
            Accept: 'application/sparql-results+json'
          }
        })
        .toPromise();

      const bindings = response?.data?.results?.bindings || [];

      const title = this.first(bindings, 'itemLabel');

      if (!title) {
        return null;
      }

      const authors = this.distinct(bindings, 'authorLabel');
      const publisher = this.first(bindings, 'publisherLabel');
      const pubDate = this.first(bindings, 'pubDate');
      const pageCount = this.first(bindings, 'pageCount');
      const description = this.first(bindings, 'description');
      const item = this.first(bindings, 'item');
      const externalId = item ? item.split('/').pop() : undefined;

      this.logger.log(
        'Successfully retrieved external book info from Wikidata.'
      );

      return {
        externalId,
        title,
        authors: authors.length ? authors : ['No Author'],
        publisher,
        publishYear: pubDate ? new Date(pubDate).getFullYear() : 0,
        summary: description,
        isbn: normalized.length === 10 ? normalized : undefined,
        isbn13: normalized.length === 13 ? normalized : undefined,
        coverArt: undefined,
        pageCount: pageCount ? Number(pageCount) : undefined,
        source: this.name
      };
    } catch (err) {
      this.logger.error(
        'An error occurred when retrieving external book info from Wikidata.',
        err
      );

      return null;
    }
  }

  private first(bindings: any[], key: string): string | undefined {
    for (const binding of bindings) {
      if (binding[key]?.value) {
        return binding[key].value;
      }
    }

    return undefined;
  }

  private distinct(bindings: any[], key: string): string[] {
    const values = new Set<string>();

    for (const binding of bindings) {
      if (binding[key]?.value) {
        values.add(binding[key].value);
      }
    }

    return Array.from(values);
  }
}
