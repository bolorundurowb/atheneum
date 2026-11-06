import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class BookScanFailureDto {
  @ApiProperty({ enum: ['low-confidence', 'processing-error'] })
  @IsIn(['low-confidence', 'processing-error'])
  reason: 'low-confidence' | 'processing-error';

  @ApiProperty({ required: false, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}
