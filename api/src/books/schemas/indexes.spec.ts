/// <reference types="jest" />
import { BookSchema } from './book.schema';
import { AuthorSchema } from './author.schema';
import { PublisherSchema } from './publisher.schema';
import { BookScanFailureSchema } from './book-scan-failure.schema';
import { WishListSchema } from '../../wish-list/schemas/wish-list.schema';

describe('Owner-scoped query indexes', () => {
  it('supports library ordering, recent books, and both ISBN fields', () => {
    expect(BookSchema.indexes().map(([keys]) => keys)).toEqual([
      { owner: 1, title: 1, _id: 1 },
      { owner: 1, createdAt: -1 },
      { owner: 1, isbn: 1 },
      { owner: 1, isbn13: 1 }
    ]);
  });

  it('supports owner-scoped filter lists, wishlist ordering, and scan cleanup', () => {
    for (const schema of [AuthorSchema, PublisherSchema]) {
      expect(schema.indexes()).toContainEqual([{ owner: 1, name: 1 }, {}]);
    }
    expect(WishListSchema.indexes()).toContainEqual([
      { owner: 1, title: 1 },
      {}
    ]);
    expect(BookScanFailureSchema.indexes()).toContainEqual([{ owner: 1 }, {}]);
  });
});
