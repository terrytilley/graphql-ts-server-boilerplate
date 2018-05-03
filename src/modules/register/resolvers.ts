import * as yup from 'yup';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entity/User';
import { ResolverMap } from '../../types/graphql-utils';
import { formatYupError } from '../../utils/formatYupError';
import { createConfirmEmailLink } from '../../utils/createConfirmEmailLink';
import {
  duplicateEmail,
  emailMinLength,
  invalidEmail,
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
    register: async (_, args: GQL.IRegisterOnMutationArguments, { redis, url }) => {
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

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        email,
        password: hashedPassword,
      });

      await user.save();

      const link = await createConfirmEmailLink(url, user.id, redis);

      return null;
    },
  },
};
