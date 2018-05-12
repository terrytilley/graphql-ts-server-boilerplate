import * as yup from 'yup';

import { User } from '../../entity/User';
// import { sendEmail } from '../../utils/sendEmail';
import { ResolverMap } from '../../types/graphql-utils';
import { formatYupError } from '../../utils/formatYupError';
// import { createConfirmEmailLink } from '../../utils/createConfirmEmailLink';
import {
  invalidEmail,
  duplicateEmail,
  emailMinLength,
  passwordMinLength,
} from './errorMessages';

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailMinLength)
    .max(255)
    .email(invalidEmail),
  password: yup
    .string()
    .min(3, passwordMinLength)
    .max(255),
});

export const resolvers: ResolverMap = {
  Query: {
    bye: () => 'bye',
  },
  Mutation: {
    register: async (_, args: GQL.IRegisterOnMutationArguments /*{ redis, url }*/) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const { email, password } = args;
      const userAlreadyExists = await User.findOne({
        where: { email },
        select: ['id'],
      });

      if (userAlreadyExists) {
        return [
          {
            path: 'email',
            message: duplicateEmail,
          },
        ];
      }

      const user = User.create({
        email,
        password,
      });

      await user.save();

      // if (process.env.NODE_ENV !== 'test') {
      //   await sendEmail(email, await createConfirmEmailLink(url, user.id, redis));
      // }

      return null;
    },
  },
};
