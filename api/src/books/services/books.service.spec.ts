/// <reference types="jest" />
import { Model, PipelineStage } from 'mongoose';
import { BooksService } from './books.service';
import { AuthorService } from './author.service';
import { PublisherService } from './publisher.service';
import { BookDocument } from '../schemas/book.schema';
import { AuthorDocument } from '../schemas/author.schema';
import { PublisherDocument } from '../schemas/publisher.schema';
import { BookScanFailureDocument } from '../schemas/book-scan-failure.schema';

describe('Library queries and cleanup', () => {
  const aggregate = jest.fn().mockResolvedValue([]);
  const deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
  const deleteFailures = jest.fn().mockResolvedValue({ deletedCount: 1 });
  const model = { aggregate, deleteMany } as unknown as Model<BookDocument>;
  const service = new BooksService(null, null, null, model, null, null, {
    deleteMany: deleteFailures
  } as unknown as Model<BookScanFailureDocument>);
  const pipeline = (): PipelineStage[] =>
    aggregate.mock.calls[0][0] as PipelineStage[];

  beforeEach(() => jest.clearAllMocks());

  it('filters raw references and sorts before joins; populates only page authors', async () => {
    await service.getAll('owner-a', {
      skip: 50,
      limit: 50,
      publisherId: 'publisher-a',
      authorId: 'author-a',
      publishYear: 2020,
      available: false
    });
    expect(pipeline().slice(0, 2)).toEqual([
      {
        $match: {
          owner: 'owner-a',
          publisher: 'publisher-a',
          authors: 'author-a',
          publishYear: 2020,
          isAvailable: false
        }
      },
      { $sort: { title: 1, _id: 1 } }
    ]);
    expect(pipeline().slice(3, 6)).toEqual([
      { $unwind: '$publisher' },
      { $skip: 50 },
      { $limit: 50 }
    ]);
    expect(pipeline()[6]).toHaveProperty('$lookup.from', 'authors');
  });

  it('searches joined names before pagination and escapes regex metacharacters', async () => {
    await service.getAll('owner-a', { skip: 0, limit: 10, search: ' A+B ' });
    expect(pipeline()[0]).toEqual({ $match: { owner: 'owner-a' } });
    expect(pipeline()[4]).toHaveProperty('$lookup.from', 'authors');
    expect(pipeline()[5]).toEqual({
      $match: {
        $or: [
          { title: { $regex: /A\+B/i } },
          { isbn: { $regex: /A\+B/i } },
          { isbn13: { $regex: /A\+B/i } },
          { 'publisher.name': { $regex: /A\+B/i } },
          { 'authors.name': { $regex: /A\+B/i } }
        ]
      }
    });
    expect(pipeline().slice(6)).toEqual([{ $skip: 0 }, { $limit: 10 }]);
  });

  it('applies year searches before joins and ignores whitespace searches', async () => {
    await service.getAll('owner-a', { skip: 0, limit: 10, search: '2021' });
    expect(pipeline()[0]).toEqual({
      $match: { owner: 'owner-a', publishYear: 2021 }
    });
    aggregate.mockClear();
    await service.getAll('owner-a', { skip: 0, limit: 10, search: '  ' });
    expect(pipeline()).toHaveLength(7);
  });

  it('deletes only the requested owner in bulk, including scan failures', async () => {
    await service.removeOwned('owner-a');
    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({ owner: 'owner-a' });
    expect(deleteFailures).toHaveBeenCalledWith({ owner: 'owner-a' });
  });

  it('propagates failed deletes', async () => {
    deleteMany.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.removeOwned('owner-a')).rejects.toThrow(
      'database unavailable'
    );
    expect(deleteFailures).not.toHaveBeenCalled();
  });

  it('deletes authors and publishers with one owner-scoped operation each', async () => {
    await new AuthorService(
      model as unknown as Model<AuthorDocument>,
      model
    ).removeOwned('owner-a');
    await new PublisherService(
      model as unknown as Model<PublisherDocument>,
      model
    ).removeOwned('owner-b');
    expect(deleteMany.mock.calls).toEqual([
      [{ owner: 'owner-a' }],
      [{ owner: 'owner-b' }]
    ]);
  });
});
