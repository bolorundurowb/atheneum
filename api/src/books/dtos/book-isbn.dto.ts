/**
 * Created by bolorundurowb on 1/2/2021
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class BookIsbnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  isbn: string;
}
