import { describe, expect, it } from 'vitest';
import { thumbnailUrl } from './thumbnail';

describe('Book thumbnails', () => {
  it('requests small automatic-format Cloudinary images for cards', () => {
    expect(thumbnailUrl('http://res.cloudinary.com/library/image/upload/v123/cover.jpg'))
      .toBe('https://res.cloudinary.com/library/image/upload/c_limit,w_320,h_480,q_auto,f_auto/v123/cover.jpg');
  });

  it('preserves other providers, local assets, signed URLs and query strings', () => {
    for (const url of [
      'https://covers.openlibrary.org/b/id/1-L.jpg',
      '/assets/cover.jpg',
      'https://res.cloudinary.com/library/image/upload/s--signature--/cover.jpg',
      'https://res.cloudinary.com/library/image/upload/cover.jpg?token=example',
      'https://res.cloudinary.com.example.test/library/image/upload/cover.jpg'
    ]) {
      expect(thumbnailUrl(url)).toBe(url);
    }
    expect(thumbnailUrl(undefined)).toBeUndefined();
    expect(thumbnailUrl('http://example.test/cover.jpg')).toBe('https://example.test/cover.jpg');
  });
});
