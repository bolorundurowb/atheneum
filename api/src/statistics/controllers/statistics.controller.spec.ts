/// <reference types="jest" />
import { StatisticsController } from './statistics.controller';
import { AuthorService } from '../../books/services/author.service';
import { BooksService } from '../../books/services/books.service';
import { PublisherService } from '../../books/services/publisher.service';
import { WishListService } from '../../wish-list/services/wish-list.service';

describe('Concurrent statistics', () => {
  it('starts every owner-scoped count before any resolves', async () => {
    const requests = Array.from({ length: 4 }, () => {
      let resolve: (value: number) => void;
      const promise = new Promise<number>((done) => {
        resolve = done;
      });
      return {
        getAllCount: jest.fn().mockReturnValue(promise),
        resolve: (value: number) => resolve(value)
      };
    });
    const controller = new StatisticsController(
      requests[1] as unknown as AuthorService,
      requests[0] as unknown as BooksService,
      requests[2] as unknown as PublisherService,
      requests[3] as unknown as WishListService
    );
    const result = controller.getAll({ user: { id: 'owner-a' } });
    requests.forEach((request, index) => {
      expect(request.getAllCount).toHaveBeenCalledWith('owner-a');
      request.resolve(index + 1);
    });
    await expect(result).resolves.toEqual({
      books: 1,
      authors: 2,
      publishers: 3,
      wishListItems: 4
    });
  });

  it('propagates count failures rather than returning incomplete statistics', async () => {
    const counter = {
      getAllCount: jest
        .fn()
        .mockRejectedValue(new Error('database unavailable'))
    };
    const controller = new StatisticsController(
      counter as unknown as AuthorService,
      counter as unknown as BooksService,
      counter as unknown as PublisherService,
      counter as unknown as WishListService
    );
    await expect(
      controller.getAll({ user: { id: 'owner-a' } })
    ).rejects.toThrow('database unavailable');
  });
});
