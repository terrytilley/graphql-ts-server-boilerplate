import { User } from '../../entity/User';
import { request } from 'graphql-request';
import { startServer } from '../../startServer';
import {
  duplicateEmail,
  emailMinLength,
  invalidEmail,
  passwordMinLength,
} from './errorMessages';

let getHost = () => '';

beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address();
  getHost = () => `http://127.0.0.1:${port}`;
});

const email = 'tester@test.com';
const password = 'qwerty123';

const mutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

test('Register user', async () => {
  const response = await request(getHost(), mutation(email, password));
  expect(response).toEqual({ register: null });

  const users = await User.find({ where: { email } });
  expect(users).toHaveLength(1);

  const user = users[0];
  expect(user.email).toEqual(email);
  expect(user.password).not.toEqual(password);
});

test('Duplicate email', async () => {
  const response: any = await request(getHost(), mutation(email, password));
  expect(response.register).toHaveLength(1);
  expect(response.register[0]).toEqual({ path: 'email', message: duplicateEmail });
});

test('Catch bad email', async () => {
  const response: any = await request(getHost(), mutation('x', password));
  expect(response).toEqual({
    register: [
      { path: 'email', message: emailMinLength },
      { path: 'email', message: invalidEmail },
    ],
  });
});

test('Catch bad password', async () => {
  const response: any = await request(getHost(), mutation(email, 'x'));
  expect(response).toEqual({
    register: [{ path: 'password', message: passwordMinLength }],
  });
});

test('Catch bad email and password', async () => {
  const response: any = await request(getHost(), mutation('x', 'x'));
  expect(response).toEqual({
    register: [
      { path: 'email', message: emailMinLength },
      { path: 'email', message: invalidEmail },
      { path: 'password', message: passwordMinLength },
    ],
  });
});
