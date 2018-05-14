import axios from 'axios';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';

let conn: Connection;
let userId: string;
const email = 'john@doe.com';
const password = 'qwerty123';

const meQuery = `
  {
    me {
      id
      email
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

const logoutMutation = `
  mutation {
    logout
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

describe('logout', () => {
  it('can logout a user', async () => {
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

    await axios.post(
      process.env.TEST_HOST as string,
      { query: logoutMutation },
      { withCredentials: true }
    );

    const response2 = await axios.post(
      process.env.TEST_HOST as string,
      { query: meQuery },
      { withCredentials: true }
    );

    expect(response2.data.data.me).toBeNull();
  });
});
