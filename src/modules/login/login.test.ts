import * as faker from 'faker';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { TestClient } from '../../utils/TestClient';
import { invalidLogin, confirmEmail } from './errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeormConn';

let conn: Connection;
const email = faker.internet.email();
const password = faker.internet.password();
const client = new TestClient(process.env.TEST_HOST as string);

const loginExpectError = async (e: string, p: string, errMsg: string) => {
  const response = await client.login(e, p);

  expect(response.data).toEqual({
    login: [
      {
        path: 'email',
        message: errMsg,
      },
    ],
  });
};

beforeAll(async () => {
  conn = await createTypeOrmConn();
});

afterAll(async () => {
  conn.close();
});

describe('Login user', async () => {
  it('should error when logging in a user', async () => {
    await loginExpectError(
      faker.internet.email(),
      faker.internet.password(),
      invalidLogin
    );
  });

  it('should error if user not confirmed', async () => {
    await client.register(email, password);
    await loginExpectError(email, password, confirmEmail);

    await User.update({ email }, { confirmed: true });
    await loginExpectError(email, faker.internet.password(), invalidLogin);

    const response = await client.login(email, password);
    expect(response.data).toEqual({ login: null });
  });
});
