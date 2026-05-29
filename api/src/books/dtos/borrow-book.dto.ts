/**
 * Created by bolorundurowb on 1/23/2021
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BorrowBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  borrowerName: string;
}
