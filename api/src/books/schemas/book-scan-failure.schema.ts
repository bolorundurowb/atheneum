import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as shortId from 'shortid';

export type BookScanFailureDocument = BookScanFailure & Document;

@Schema()
export class BookScanFailure {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop({ type: String, ref: 'User', required: true })
  owner: string;

  @Prop({ required: true, enum: ['low-confidence', 'processing-error'] })
  reason: string;

  @Prop({ min: 0, max: 1 })
  confidence?: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const BookScanFailureSchema =
  SchemaFactory.createForClass(BookScanFailure);
