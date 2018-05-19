import * as Redis from 'ioredis';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { expiredKey } from './errorMessages';
import { TestClient } from '../../utils/TestClient';
import { passwordMinLength } from '../register/errorMessages';
import { forgotPasswordLocked } from '../login/errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordLockAccount';

let conn: Connection;
const redis = new Redis();
const email = 'john@doe.com';
const password = 'qwerty123';
const newPassword = 'qwertyuiop1234';

let userId: string;
beforeAll(async () => {
  conn = await createTypeOrmConn();

  const user = await User.create({
    email,
    password,
    confirmed: true,
  }).save();

  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe('forgot password', () => {
  it('can reset password', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    // lock account
    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink('', userId, redis);

    const parts = url.split('/');
    const key = parts[parts.length - 1];

    // make sure you can't login to locked account
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: 'email',
            message: forgotPasswordLocked,
          },
        ],
      },
    });

    // try changing to a password that's too short
    expect(await client.forgotPasswordChange('x', key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: 'newPassword',
            message: passwordMinLength,
          },
        ],
      },
    });

    const response = await client.forgotPasswordChange(newPassword, key);
    expect(response.data).toEqual({
      forgotPasswordChange: null,
    });

    // make sure redis key expires after password change
    expect(await client.forgotPasswordChange('alksdjfalksdjfl', key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: 'key',
            message: expiredKey,
          },
        ],
      },
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null,
      },
    });
  });
});
