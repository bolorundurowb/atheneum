/**
 * Created by bolorundurowb on 12/26/2020
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as shortId from 'shortid';

export type AuthorDocument = Author & Document;

@Schema()
export class Author {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  owner: User;

  @Prop()
  name: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
