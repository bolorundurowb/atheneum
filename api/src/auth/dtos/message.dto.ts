/**
 * Created by bolorundurowb on 6/19/2021
 */
import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty()
  message: string;
}
