import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { TestClient } from '../../utils/TestClient';
import {
  invalidEmail,
  duplicateEmail,
  emailMinLength,
  passwordMinLength,
} from './errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';

let conn: Connection;
const email = 'tester@test.com';
const password = 'qwerty123';

beforeAll(async () => {
  conn = await createTypeOrmConn();
});

afterAll(async () => {
  conn.close();
});

describe('Register user', async () => {
  it('should check for duplicate emails', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.register(email, password);
    expect(response.data).toEqual({ register: null });

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);

    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: 'email',
      message: duplicateEmail,
    });
  });

  it('should check bad email', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response: any = await client.register('x', password);
    expect(response.data).toEqual({
      register: [
        {
          path: 'email',
          message: emailMinLength,
        },
        {
          path: 'email',
          message: invalidEmail,
        },
      ],
    });
  });

  it('should check bad password', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response: any = await client.register(email, 'x');
    expect(response.data).toEqual({
      register: [
        {
          path: 'password',
          message: passwordMinLength,
        },
      ],
    });
  });

  it('should check bad password and bad email', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response: any = await client.register('x', 'x');
    expect(response.data).toEqual({
      register: [
        {
          path: 'email',
          message: emailMinLength,
        },
        {
          path: 'email',
          message: invalidEmail,
        },
        {
          path: 'password',
          message: passwordMinLength,
        },
      ],
    });
  });
});
