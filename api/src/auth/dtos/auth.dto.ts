/**
 * Created by bolorundurowb on 1/3/2021
 */

import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  authToken: string;

  @ApiProperty()
  emailAddress: string;

  @ApiProperty()
  isEmailVerified: boolean;
}
