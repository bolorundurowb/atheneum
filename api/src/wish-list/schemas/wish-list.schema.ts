/**
 * Created by bolorundurowb on 1/15/2021
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as shortId from 'shortid';

export type WishListDocument = WishList & Document;

@Schema()
export class WishList {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop()
  title: string;

  @Prop()
  authorName: string;

  @Prop()
  isbn: string;

  @Prop({
    default:
      'https://res.cloudinary.com/dg2dgzbt4/image/upload/v1625842121/external_assets/open_source/icons/default-book-cover.png'
  })
  coverArt: string;

  @Prop({ type: String, ref: 'User' })
  owner: User;
}

export const WishListSchema = SchemaFactory.createForClass(WishList);
