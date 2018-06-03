import 'dotenv/config';
import 'reflect-metadata';

import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import { GraphQLServer } from 'graphql-yoga';

import redis from './redis';
import confirmEmail from './routes/confirmEmail';
import generateSchema from './utils/generateSchema';
import createTypeOrmConn from './utils/createTypeormConn';
import { redisSessionPrefix } from './constants';

const RedisStore = connectRedis(session);

export default async () => {
  if (process.env.NODE_ENV === 'test') {
    await redis.flushall();
  }

  const server = new GraphQLServer({
    schema: generateSchema(),
    context: ({ request }) => ({
      redis,
      url: request.protocol + '://' + request.get('host'),
      session: request.session,
      req: request,
    }),
  });

  server.express.use(
    new RateLimit({
      store: new RateLimitRedisStore({ client: redis }),
      windowMs: 15 * 60 * 1000,
      max: 100,
      delayMs: 0,
    })
  );

  server.express.use(
    session({
      name: 'qid',
      store: new RedisStore({ client: redis as any, prefix: redisSessionPrefix }),
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  server.express.get('/confirm/:id', confirmEmail);

  if (process.env.NODE_ENV === 'test') {
    await createTypeOrmConn(true);
  } else {
    await createTypeOrmConn();
  }

  const origin = process.env.NODE_ENV === 'test' ? '*' : process.env.FRONTEND_HOST;
  const port = process.env.NODE_ENV === 'test' ? 0 : process.env.PORT;
  const cors = { credentials: true, origin };
  const app = await server.start({ cors, port });

  console.log(`Server is running on http://localhost:${port}`);
  return app;
};
