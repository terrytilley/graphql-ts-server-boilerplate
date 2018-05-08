import { request } from 'graphql-request';

import { User } from '../../entity/User';
import { invalidLogin, confirmEmail } from './errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeormConn';

const email = 'tester@test.com';
const password = 'qwerty123';

const registerMutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginMutation = (e: string, p: string) => `
  mutation {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginExpectError = async (e: string, p: string, errMsg: string) => {
  const response = await request(process.env.TEST_HOST as string, loginMutation(e, p));

  expect(response).toEqual({
    login: [
      {
        path: 'email',
        message: errMsg,
      },
    ],
  });
};

beforeAll(async () => {
  await createTypeOrmConn();
});

describe('Login user', async () => {
  it('should error when logging in a user', async () => {
    await loginExpectError('john@doe.com', 'xxxxxxxxxx', invalidLogin);
  });

  it('should error if user not confirmed', async () => {
    await request(process.env.TEST_HOST as string, registerMutation(email, password));

    await loginExpectError(email, password, confirmEmail);
    await User.update({ email }, { confirmed: true });

    await loginExpectError(email, 'xxxxxxxxxx', invalidLogin);
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );
    expect(response).toEqual({
      login: null,
    });
  });
});
