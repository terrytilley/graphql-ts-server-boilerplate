import * as faker from 'faker';
import { Connection } from 'typeorm';

import User from '../../../entity/User';
import TestClient from '../../../utils/TestClient';
import createTypeormConn from '../../../utils/createTypeormConn';

let userId: string;
let conn: Connection;
const email = faker.internet.email();
const password = faker.internet.password();

beforeAll(async () => {
  conn = await createTypeormConn();

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

describe('logout', () => {
  it('can log a user out of multiple sessions', async () => {
    const session1 = new TestClient(process.env.TEST_HOST as string);
    const session2 = new TestClient(process.env.TEST_HOST as string);

    await session1.login(email, password);
    await session2.login(email, password);
    expect(await session1.me()).toEqual(await session2.me());

    await session1.logout();
    expect(await session1.me()).toEqual(await session2.me());
  });

  it('can log a user out of a single session', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);
    const response = await client.me();
    expect(response.data).toEqual({ me: { id: userId, email } });

    await client.logout();
    const response2 = await client.me();
    expect(response2.data.me).toBeNull();
  });
});
