import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { TestClient } from '../../utils/TestClient';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';

let userId: string;
let conn: Connection;
const email = 'john@doe.com';
const password = 'qwerty123';

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

describe('logout', () => {
  it('can logout a user', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);
    const response = await client.me();
    expect(response.data).toEqual({ me: { id: userId, email } });

    await client.logout();
    const response2 = await client.me();
    expect(response2.data.me).toBeNull();
  });
});
