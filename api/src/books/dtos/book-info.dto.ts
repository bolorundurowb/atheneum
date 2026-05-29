/**
 * Created by bolorundurowb on 1/2/2021
 */

export class BookInfoDto {
  externalId: string;
  title: string;
  summary: string;
  isbn: string;
  isbn13: string;
  publishYear: number;
  authors: Array<string>;
  publisher: string;
  coverArt?: string;
  pageCount?: number;
  source: string;
}
