import * as faker from 'faker';
import * as Redis from 'ioredis';
import fetch from 'node-fetch';
import { Connection } from 'typeorm';

import User from '../../../entity/User';
import createTypeOrmConn from '../../../utils/createTypeOrmConn';
import createConfirmEmailLink from './createConfirmEmailLink';

faker.seed(Date.now() + 4);

let userId = '';
const redis = new Redis();
let conn: Connection;

beforeAll(async () => {
  conn = await createTypeOrmConn();

  const user = User.create({
    email: faker.internet.email(),
    password: faker.internet.password(),
  });

  await user.save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe('createConfirmEmailLink', () => {
  test('Make sure it confirms user and clears key in redis', async () => {
    const url = await createConfirmEmailLink(
      process.env.TEST_HOST as string,
      userId,
      redis
    );

    const response = await fetch(url);
    const text = await response.text();
    expect(text).toEqual('ok');

    const user = await User.findOne({ where: { id: userId } });
    expect((user as User).confirmed).toBeTruthy();

    const chunks = url.split('/');
    const key = chunks[chunks.length - 1];
    const value = await redis.get(key);
    expect(value).toBeNull();
  });
});
