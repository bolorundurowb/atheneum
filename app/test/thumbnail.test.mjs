import assert from 'node:assert/strict';
import { test } from 'node:test';
import { thumbnailUrl } from '../src/app/shared/book/thumbnail.ts';

test('requests small automatic-format Cloudinary images for cards', () => {
  assert.equal(
    thumbnailUrl('http://res.cloudinary.com/library/image/upload/v123/cover.jpg'),
    'https://res.cloudinary.com/library/image/upload/c_limit,w_320,h_480,q_auto,f_auto/v123/cover.jpg'
  );
});

test('preserves other providers, local assets, signed URLs and existing query strings', () => {
  for (const url of [
    'https://covers.openlibrary.org/b/id/1-L.jpg',
    '/assets/cover.jpg',
    'https://res.cloudinary.com/library/image/upload/s--signature--/cover.jpg',
    'https://res.cloudinary.com/library/image/upload/cover.jpg?token=example',
    'https://res.cloudinary.com.example.test/library/image/upload/cover.jpg'
  ]) {
    assert.equal(thumbnailUrl(url), url);
  }
  assert.equal(thumbnailUrl(undefined), undefined);
  assert.equal(thumbnailUrl('http://example.test/cover.jpg'), 'https://example.test/cover.jpg');
});
