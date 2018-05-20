import 'dotenv/config';
import 'reflect-metadata';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import { GraphQLServer } from 'graphql-yoga';

import { redis } from './redis';
import { genSchema } from './utils/genSchema';
import { redisSessionPrefix } from './constants';
import { confirmEmail } from './routes/confirmEmail';
import { createTypeOrmConn } from './utils/createTypeormConn';

const RedisStore = connectRedis(session);
const SESSION_SECRET = 'd3c3f2fc5b1fb7caaae5c1f9540025982bc7202be927aab11551840d2e6';

export const startServer = async () => {
  const server = new GraphQLServer({
    schema: genSchema(),
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
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  const cors = {
    credentials: true,
    origin: process.env.NODE_ENV === 'test' ? '*' : (process.env.FRONTEND_HOST as string),
  };

  server.express.get('/confirm/:id', confirmEmail);

  await createTypeOrmConn();

  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === 'test' ? 0 : 4000,
  });

  console.log('Server is running on localhost:4000');
  return app;
};
