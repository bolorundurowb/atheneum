import { convertToHttps } from '../../utils/http';

export function thumbnailUrl(coverArt?: string): string | undefined {
  if (!coverArt) {
    return undefined;
  }
  const httpsUrl = convertToHttps(coverArt);
  try {
    const url = new URL(httpsUrl);
    if (url.hostname === 'res.cloudinary.com' && !url.search &&
        !url.pathname.includes('/s--')) {
      return httpsUrl.replace('/image/upload/', '/image/upload/c_limit,w_320,h_480,q_auto,f_auto/');
    }
  } catch {
    // Preserve local asset paths and other existing image sources.
  }
  return httpsUrl;
}
