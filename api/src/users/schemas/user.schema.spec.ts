/// <reference types="jest" />
import { createConnection, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from './user.schema';

describe('Asynchronous password persistence', () => {
  const connection = createConnection();
  const model = connection.model(User.name, UserSchema);
  const insert = jest.spyOn(model.collection, 'insertOne').mockResolvedValue({
    acknowledged: true,
    insertedId: new Types.ObjectId()
  });
  const update = jest.spyOn(model.collection, 'updateOne').mockResolvedValue({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedCount: 0,
    upsertedId: null
  });

  beforeEach(() => jest.clearAllMocks());

  it('hashes new passwords before inserting without blocking bcrypt calls', async () => {
    const user = new model({
      emailAddress: 'reader@example.test',
      passwordHash: 'initial password'
    });
    await user.save();
    expect(await bcrypt.compare('initial password', user.passwordHash)).toBe(
      true
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: user.passwordHash }),
      expect.anything()
    );
    expect(user.passwordHash).not.toBe('initial password');
  });

  it('preserves existing hashes when saving unrelated profile changes', async () => {
    const hash = await bcrypt.hash('existing password', 10);
    const user = model.hydrate({
      _id: 'user-a',
      emailAddress: 'reader@example.test',
      passwordHash: hash,
      isEmailVerified: false
    });
    user.firstName = 'Reader';
    await user.save();
    expect(user.passwordHash).toBe(hash);
    expect(update).toHaveBeenCalledWith(
      { _id: 'user-a' },
      { $set: { firstName: 'Reader' } },
      expect.anything()
    );
  });

  it('hashes replacement passwords on existing accounts', async () => {
    const user = model.hydrate({
      _id: 'user-a',
      emailAddress: 'reader@example.test',
      passwordHash: await bcrypt.hash('old password', 10)
    });
    user.passwordHash = 'replacement password';
    await user.save();
    expect(
      await bcrypt.compare('replacement password', user.passwordHash)
    ).toBe(true);
    expect(await bcrypt.compare('old password', user.passwordHash)).toBe(false);
  });
});
