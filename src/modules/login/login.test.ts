import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { TestClient } from '../../utils/TestClient';
import { invalidLogin, confirmEmail } from './errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeormConn';

let conn: Connection;
const email = 'tester@test.com';
const password = 'qwerty123';

const loginExpectError = async (
  client: TestClient,
  e: string,
  p: string,
  errMsg: string
) => {
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
    const client = new TestClient(process.env.TEST_HOST as string);

    await loginExpectError(client, 'john@doe.com', 'xxxxxxxxxx', invalidLogin);
  });

  it('should error if user not confirmed', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.register(email, password);
    await loginExpectError(client, email, password, confirmEmail);
    await User.update({ email }, { confirmed: true });

    await loginExpectError(client, email, 'xxxxxxxxxx', invalidLogin);
    const response = await client.login(email, password);
    expect(response.data).toEqual({ login: null });
  });
});
