import axios from 'axios';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';

let conn: Connection;
let userId: string;
const email = 'john@doe.com';
const password = 'qwerty123';

const loginMutation = (e: string, p: string) => `
  mutation {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const meQuery = `
  {
    me {
      id
      email
    }
  }
`;

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
  // it("can't get user if not logged in", async () => {
  //   // Later
  // });

  it('can get current user', async () => {
    await axios.post(
      process.env.TEST_HOST as string,
      { query: loginMutation(email, password) },
      { withCredentials: true }
    );

    const response = await axios.post(
      process.env.TEST_HOST as string,
      { query: meQuery },
      { withCredentials: true }
    );

    expect(response.data.data).toEqual({ me: { id: userId, email } });
  });
});
