import * as bcrypt from 'bcryptjs';

import User from '../../../entity/User';
import { ResolverMap } from '../../../types/graphql-utils';
import { userSessionIdPrefix } from '../../../constants';
import { invalidLogin, confirmEmail, forgotPasswordLocked } from './errorMessages';

const errorResponse = [
  {
    path: 'email',
    message: invalidLogin,
  },
];

export const resolvers: ResolverMap = {
  Mutation: {
    login: async (
      _,
      { email, password }: GQL.ILoginOnMutationArguments,
      { session, redis, req }
    ) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return errorResponse;
      }

      if (!user.confirmed) {
        return [
          {
            path: 'email',
            message: confirmEmail,
          },
        ];
      }

      if (user.forgotPasswordLocked) {
        return [
          {
            path: 'email',
            message: forgotPasswordLocked,
          },
        ];
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return errorResponse;
      }

      // Login successful
      session.userId = user.id;

      if (req.sessionID) {
        await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
      }

      return null;
    },
  },
};
