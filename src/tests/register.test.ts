import { request } from 'graphql-request';

import { createTypeOrmConn } from '../utils/createTypeOrmConn';
import { User } from '../entity/User';
import { host } from './constants';

beforeAll(async () => {
  await createTypeOrmConn();
});

const email = 'tester@test.com';
const password = 'qwerty123';

const mutation = `
  mutation {
    register(email: "${email}", password: "${password}")
  }
`;

test('Register user', async () => {
  const response = await request(host, mutation);
  expect(response).toEqual({ register: true });

  const users = await User.find({ where: { email } });
  expect(users).toHaveLength(1);

  const user = users[0];
  expect(user.email).toEqual(email);
  expect(user.password).not.toEqual(password);
});
