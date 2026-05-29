/**
 * Created by bolorundurowb on 12/26/2020
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as shortId from 'shortid';

export type PublisherDocument = Publisher & Document;

@Schema()
export class Publisher {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  owner: User;

  @Prop({ required: true })
  name: string;
}

export const PublisherSchema = SchemaFactory.createForClass(Publisher);
