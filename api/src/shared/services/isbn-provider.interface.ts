import { BookInfoDto } from '../../books/dtos/book-info.dto';

export interface IsbnProvider {
  readonly name: string;
  search(isbn: string): Promise<BookInfoDto>;
}
