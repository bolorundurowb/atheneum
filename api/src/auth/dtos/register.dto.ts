/**
 * Created by bolorundurowb on 6/23/2021
 */
import { CredentialsDto } from './credentials.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends CredentialsDto {
  @ApiProperty()
  fullName: string;
}
