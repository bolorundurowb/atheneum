import { BookInfoDto } from '../../books/dtos/book-info.dto';

export interface IsbnProvider {
  readonly name: string;
  search(isbn: string, signal?: AbortSignal): Promise<BookInfoDto>;
}
