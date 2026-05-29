/**
 * Created by bolorundurowb on 1/3/2021
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  MaxLength,
  MinLength
} from 'class-validator';

export class BookManualDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  authors: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  @MinLength(10)
  @MaxLength(13)
  isbn: string;

  @ApiProperty()
  publishYear: number;

  @ApiProperty()
  publisher: string;

  @ApiProperty()
  @IsOptional()
  pageCount?: number;
}
