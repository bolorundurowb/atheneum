/**
 * Created by bolorundurowb on 1/8/2021
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BookQueryDto {
  @ApiProperty()
  @IsOptional()
  search?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  skip: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(50)
  limit: number;

  @ApiProperty()
  @IsOptional()
  available?: boolean;

  @ApiProperty()
  @IsOptional()
  publisherId?: string;

  @ApiProperty()
  @IsOptional()
  authorId?: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  publishYear?: number;
}
