import { createConnection, getConnectionOptions } from 'typeorm';

const createTypeOrmConn = async (resetDB: boolean = false) => {
  const connectionOptions = await getConnectionOptions(process.env.NODE_ENV);
  return createConnection({
    ...connectionOptions,
    name: 'default',
    synchronize: resetDB,
    dropSchema: resetDB,
  });
};

export default createTypeOrmConn;
