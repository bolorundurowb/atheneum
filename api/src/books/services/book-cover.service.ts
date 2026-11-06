import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class BookCoverService {
  constructor(private config: ConfigService) {}

  async upload(dataUrl: string): Promise<string> {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      throw new BadRequestException('Choose a JPEG, PNG, or WebP cover image.');
    }
    if (dataUrl.length > 8 * 1024 * 1024) {
      throw new BadRequestException('Cover images must be smaller than 6 MB.');
    }

    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Book cover uploads are not configured.'
      );
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      folder: 'atheneum',
      resource_type: 'image',
      transformation: { width: 1200, height: 1800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
    });
    return result.secure_url;
  }
}
