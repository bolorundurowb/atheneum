/**
 * Created by bolorundurowb on 1/15/2021
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddBookDto {
  @ApiProperty()
  @IsString()
  bookTitle: string;

  @ApiProperty()
  @IsString()
  bookAuthor: string;

  @ApiProperty()
  @IsOptional()
  bookIsbn: string;
}
