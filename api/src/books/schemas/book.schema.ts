/**
 * Created by bolorundurowb on 12/26/2020
 */

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Author } from './author.schema';
import { Publisher } from './publisher.schema';
import * as shortId from 'shortid';

export type BookDocument = Book & Document;

@Schema()
export class Book {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop()
  externalId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  summary: string;

  @Prop()
  isbn: string;

  @Prop()
  isbn13: string;

  @Prop({
    default:
      'https://res.cloudinary.com/dg2dgzbt4/image/upload/v1626269455/external_assets/open_source/images/rsz_no-book-image.jpg'
  })
  coverArt: string;

  @Prop()
  publishYear: number;

  @Prop()
  pageCount: number;

  @Prop()
  source: string;

  @Prop({ type: String, ref: 'User' })
  owner: User;

  @Prop({ type: [{ type: String, ref: 'Author' }] })
  authors: Array<Author>;

  @Prop({ type: String, ref: 'Publisher' })
  publisher: Publisher;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop(
    raw([
      {
        borrowedBy: { type: String },
        borrowedAt: { type: Date },
        returnedAt: { type: Date }
      }
    ])
  )
  borrowingHistory: Array<Record<string, any>>;
}

export const BookSchema = SchemaFactory.createForClass(Book);
