import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BookCoverDto {
  @ApiProperty({ description: 'A JPEG, PNG, or WebP image data URL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8 * 1024 * 1024)
  image: string;
}
