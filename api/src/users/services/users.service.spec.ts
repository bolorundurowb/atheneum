/// <reference types="jest" />
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserDocument } from '../schemas/user.schema';
import { AuthService } from '../../auth/services/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('Password checks', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const findById = jest.fn();
  const findOne = jest.fn();
  const users = new UsersService({
    findById,
    findOne
  } as unknown as Model<UserDocument>);
  const sign = jest.fn().mockReturnValue('token');
  const auth = new AuthService(
    users,
    { sign } as unknown as JwtService,
    null,
    null,
    null
  );
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('current password', 10);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({ passwordHash, save });
    findOne.mockResolvedValue({ passwordHash, _id: 'user-a' });
  });

  it('accepts the correct current password and saves the replacement', async () => {
    await users.updatePassword('user-a', 'current password', 'new password');
    expect(save).toHaveBeenCalledTimes(1);
    expect((await findById.mock.results[0].value).passwordHash).toBe(
      'new password'
    );
  });

  it('rejects an incorrect current password without saving', async () => {
    await expect(
      users.updatePassword('user-a', 'incorrect password', 'new password')
    ).rejects.toThrow('Current password does not match.');
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a missing account without saving', async () => {
    findById.mockResolvedValue(null);
    await expect(
      users.updatePassword('missing', 'current password', 'new password')
    ).rejects.toThrow('User account not found.');
    expect(save).not.toHaveBeenCalled();
  });

  it('logs in with existing hashes and rejects incorrect credentials', async () => {
    await expect(
      auth.login('reader@example.test', 'current password')
    ).resolves.toHaveProperty('authToken', 'token');
    await expect(
      auth.login('reader@example.test', 'incorrect')
    ).rejects.toThrow('Invalid credentials');
    findOne.mockResolvedValue(null);
    await expect(
      auth.login('missing@example.test', 'current password')
    ).rejects.toThrow('Invalid credentials');
    expect(sign).toHaveBeenCalledTimes(1);
  });
});
