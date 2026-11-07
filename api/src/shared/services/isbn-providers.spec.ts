/// <reference types="jest" />
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { GoogleIsbnService } from './google-isbn.service';
import { OpenLibraryIsbnService } from './open-library-isbn.service';
import { ArchiveIsbnService } from './archive-isbn.service';

describe('ISBN provider cancellation', () => {
  it('passes the lookup abort signal to every external request, including authors', async () => {
    const get = jest.fn().mockReturnValue(of({ data: {} }));
    const http = { get } as unknown as HttpService;
    const config = { get: () => undefined } as unknown as ConfigService;
    const signal = new AbortController().signal;
    await new GoogleIsbnService(http, config).search('isbn', signal);
    await new ArchiveIsbnService(http).search('isbn', signal);
    get.mockReturnValueOnce(
      of({
        data: {
          key: 'book',
          title: 'Example',
          authors: [{ key: '/authors/example' }]
        }
      })
    );
    get.mockReturnValueOnce(of({ data: { name: 'Example author' } }));
    const result = await new OpenLibraryIsbnService(http).search(
      'isbn',
      signal
    );
    expect(result.authors).toEqual(['Example author']);
    expect(get).toHaveBeenCalledTimes(4);
    for (const [, options] of get.mock.calls) {
      expect(options).toMatchObject({ signal, timeout: 5000 });
    }
  });
});
