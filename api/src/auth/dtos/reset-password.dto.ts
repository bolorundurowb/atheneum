import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

/**
 * Created by bolorundurowb on 6/20/2021
 */

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  emailAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  resetCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
