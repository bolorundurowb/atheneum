/**
 * Created by bolorundurowb on 7/23/2021
 */
import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty()
  books: number;

  @ApiProperty()
  authors: number;

  @ApiProperty()
  publishers: number;

  @ApiProperty()
  wishListItems: number;
}
