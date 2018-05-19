import * as yup from 'yup';
import * as bcrypt from 'bcryptjs';

import { User } from '../../entity/User';
import { ResolverMap } from '../../types/graphql-utils';
import { forgotPasswordPrefix } from '../../constants';
import { formatYupError } from '../../utils/formatYupError';
import { registerPasswordValidation } from '../../yupSchema';
import { expiredKey, userByEmailNotFound } from './errorMessages';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordLockAccount';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';

const schema = yup.object().shape({
  newPassword: registerPasswordValidation,
});

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => 'bye',
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: 'email',
            message: userByEmailNotFound,
          },
        ];
      }

      await forgotPasswordLockAccount(user.id, redis);
      // @todo: Add frontend url
      await createForgotPasswordLink('', user.id, redis);
      // @todo: Send email with url
      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: 'key',
            message: expiredKey,
          },
        ];
      }

      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatePromise = User.update(
        { id: userId },
        {
          forgotPasswordLocked: false,
          password: hashedPassword,
        }
      );

      const deleteKeyPromise = redis.del(redisKey);

      await Promise.all([updatePromise, deleteKeyPromise]);
      return null;
    },
  },
};
