/**
 * Created by bolorundurowb on 12/26/2020
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as shortId from 'shortid';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ default: shortId.generate })
  _id: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop({
    set: (value) => {
      const salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(value, salt);
    }
  })
  passwordHash: string;

  @Prop()
  resetCode: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
