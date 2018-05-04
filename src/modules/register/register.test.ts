import { User } from '../../entity/User';
import { request } from 'graphql-request';
import {
  invalidEmail,
  duplicateEmail,
  emailMinLength,
  passwordMinLength,
} from './errorMessages';
import { createTypeOrmConn } from '../../utils/createTypeOrmConn';

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

beforeAll(async () => {
  await createTypeOrmConn();
});

describe('Register user', async () => {
  it('should check for duplicate emails', async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response).toEqual({ register: null });

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);

    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: 'email',
      message: duplicateEmail,
    });
  });

  it('should check bad email', async () => {
    const response3: any = await request(
      process.env.TEST_HOST as string,
      mutation('x', password)
    );
    expect(response3).toEqual({
      register: [
        {
          path: 'email',
          message: emailMinLength,
        },
        {
          path: 'email',
          message: invalidEmail,
        },
      ],
    });
  });

  it('should check bad password', async () => {
    const response4: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, 'x')
    );
    expect(response4).toEqual({
      register: [
        {
          path: 'password',
          message: passwordMinLength,
        },
      ],
    });
  });

  it('should check bad password and bad email', async () => {
    const response5: any = await request(
      process.env.TEST_HOST as string,
      mutation('x', 'x')
    );
    expect(response5).toEqual({
      register: [
        {
          path: 'email',
          message: emailMinLength,
        },
        {
          path: 'email',
          message: invalidEmail,
        },
        {
          path: 'password',
          message: passwordMinLength,
        },
      ],
    });
  });
});