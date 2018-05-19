import { Redis } from 'ioredis';

import { User } from '../entity/User';
import { removeAllUserSessions } from './removeAllUserSessions';

export const forgotPasswordLockAccount = async (userId: string, redis: Redis) => {
  // User can't login
  await User.update({ id: userId }, { forgotPasswordLocked: true });
  // Remove all user sessions
  await removeAllUserSessions(userId, redis);
};
