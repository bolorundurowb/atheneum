/**
 * Created by bolorundurowb on 7/26/2021
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  verificationCode: string;
}
