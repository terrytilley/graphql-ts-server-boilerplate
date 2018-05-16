import * as Redis from 'ioredis';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { TestClient } from '../../utils/TestClient';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';

let userId: string;
let conn: Connection;
const redis = new Redis();
const email = 'john@doe.com';
const password = 'qwerty123';
const newPassword = 'qwertyuiop123';

beforeAll(async () => {
  conn = await createTypeOrmConn();

  const user = User.create({
    email,
    password,
    confirmed: true,
  });

  await user.save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe('forgot password', () => {
  it('can reset password', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const url = await createForgotPasswordLink('', userId, redis);
    const urlArr = url.split('/');
    const key = urlArr[urlArr.length - 1];

    const response = await client.forgotPasswordChange(newPassword, key);
    expect(response.data).toEqual({
      forgotPasswordChange: null,
    });

    expect(await client.login(email, newPassword)).toEqual({ data: { login: null } });
  });
});
