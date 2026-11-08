/// <reference types="jest" />
import { IsbnService } from './isbn.service';
import { GoogleIsbnService } from './google-isbn.service';
import { OpenLibraryIsbnService } from './open-library-isbn.service';
import { ArchiveIsbnService } from './archive-isbn.service';
import { BookInfoDto } from '../../books/dtos/book-info.dto';

describe('ISBN lookup latency and cache', () => {
  const google = { name: 'Google Books', search: jest.fn() };
  const open = { name: 'Open Library', search: jest.fn() };
  const archive = { name: 'Internet Archive', search: jest.fn() };
  const book: BookInfoDto = {
    title: 'Example book',
    authors: ['Example author']
  } as BookInfoDto;
  let service: IsbnService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    google.search.mockResolvedValue(null);
    open.search.mockResolvedValue(null);
    archive.search.mockResolvedValue(null);
    service = new IsbnService(
      google as unknown as GoogleIsbnService,
      open as unknown as OpenLibraryIsbnService,
      archive as unknown as ArchiveIsbnService
    );
  });
  afterEach(() => jest.useRealTimers());

  it('normalizes keys, caches successful results, and isolates caller mutations', async () => {
    google.search.mockResolvedValue(book);
    const first = await service.getBookByIsbn('978-0 123456789');
    first.book.title = 'Changed by caller';
    first.book.authors.push('Another author');
    const cached = await service.getBookByIsbn('9780123456789');
    expect(cached.book.title).toBe('Example book');
    expect(cached.book.authors).toEqual(['Example author']);
    expect(google.search).toHaveBeenCalledTimes(1);
    expect(google.search).toHaveBeenCalledWith(
      '9780123456789',
      expect.any(AbortSignal)
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('deduplicates concurrent lookups and returns separate objects', async () => {
    google.search.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(book), 20))
    );
    const first = service.getBookByIsbn('9780123456789');
    const second = service.getBookByIsbn('978-0123456789');
    await jest.advanceTimersByTimeAsync(20);
    expect((await first).book).not.toBe((await second).book);
    expect(google.search).toHaveBeenCalledTimes(1);
  });

  it('expires positive entries after an hour', async () => {
    google.search.mockResolvedValue(book);
    await service.getBookByIsbn('isbn');
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
    await service.getBookByIsbn('isbn');
    expect(google.search).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest cached entry at the size limit', async () => {
    google.search.mockResolvedValue(book);
    for (let index = 0; index <= 1000; index++) {
      await service.getBookByIsbn(String(index));
    }
    await service.getBookByIsbn('0');
    expect(google.search).toHaveBeenCalledTimes(1002);
  });

  it('keeps fallback preference and does not cache failures', async () => {
    google.search.mockRejectedValue(new Error('provider unavailable'));
    open.search.mockResolvedValue(book);
    expect(await service.getBookByIsbn('isbn')).toMatchObject({
      source: open.name,
      attemptedSources: [google.name, open.name]
    });
    expect(archive.search).not.toHaveBeenCalled();
    open.search.mockResolvedValue(null);
    await service.getBookByIsbn('another-isbn');
    await service.getBookByIsbn('another-isbn');
    expect(archive.search).toHaveBeenCalledTimes(2);
  });

  it('aborts stalled providers and finishes within the overall 15-second budget', async () => {
    for (const provider of [google, open, archive]) {
      provider.search.mockImplementation(() => new Promise(() => undefined));
    }
    const result = service.getBookByIsbn('isbn');
    await jest.advanceTimersByTimeAsync(5000);
    expect((google.search.mock.calls[0][1] as AbortSignal).aborted).toBe(true);
    expect(open.search).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(10000);
    expect(await result).toEqual({
      book: null,
      source: null,
      attemptedSources: [google.name, open.name, archive.name]
    });
    expect(jest.getTimerCount()).toBe(0);
    expect((archive.search.mock.calls[0][1] as AbortSignal).aborted).toBe(true);
  });
});
