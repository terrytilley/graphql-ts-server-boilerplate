import * as faker from 'faker';
import { Connection } from 'typeorm';

import User from '../../../entity/User';
import TestClient from '../../../utils/TestClient';
import createTypeOrmConn from '../../../utils/createTypeOrmConn';

faker.seed(Date.now() + 3);

let userId: string;
let conn: Connection;
const email = faker.internet.email();
const password = faker.internet.password();

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

describe('me', () => {
  it('will return null if no cookie', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.me();
    expect(response.data.me).toBeNull();
  });

  it('can get current user', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);
    const response = await client.me();
    expect(response.data).toEqual({ me: { id: userId, email } });
  });
});
