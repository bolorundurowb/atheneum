/**
 * Created by bolorundurowb on 1/7/2021
 */
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;
}
