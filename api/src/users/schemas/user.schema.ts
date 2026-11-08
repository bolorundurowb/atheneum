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

  @Prop()
  passwordHash: string;

  @Prop()
  resetCode: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
});
