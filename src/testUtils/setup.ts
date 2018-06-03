import server from '../server';

export const setup = async () => {
  const app = await server();
  const { port } = app.address();
  process.env.TEST_HOST = `http://127.0.0.1:${port}`;
};
