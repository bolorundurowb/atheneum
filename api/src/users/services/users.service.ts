import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserProfileDto } from '../dtos/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(emailAddress: string): Promise<User | undefined> {
    return this.userModel.findOne({
      emailAddress
    });
  }

  async findById(userId: string): Promise<User | undefined> {
    return this.userModel.findById(userId);
  }

  async create(emailAddress: string, password: string): Promise<User> {
    const user = new this.userModel({
      emailAddress: emailAddress,
      passwordHash: password
    });
    return user.save();
  }

  async update(userId: string, payload: UserProfileDto): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(null, 'User account not found.');
    }

    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    await (<UserDocument>user).save();

    return user;
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(null, 'User account not found.');
    }

    if (user && bcrypt.compareSync(currentPassword, user.passwordHash)) {
      throw new BadRequestException(null, 'Current password does not match.');
    }

    user.passwordHash = newPassword;
    await (<UserDocument>user).save();
  }

  async removeAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId);
  }
}
