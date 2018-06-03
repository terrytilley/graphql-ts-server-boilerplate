import { v4 } from 'uuid';
import { Redis } from 'ioredis';

import { forgotPasswordPrefix } from '../constants';

const createForgotPasswordLink = async (url: string, userId: string, redis: Redis) => {
  const id = v4();
  await redis.set(`${forgotPasswordPrefix}${id}`, userId, 'ex', 60 * 20);
  return `${url}/reset-password/${id}`;
};

export default createForgotPasswordLink;
