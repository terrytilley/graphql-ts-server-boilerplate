import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

const pathToModules = path.join(__dirname, '../modules');

const generateSchema = () => {
  const typeDefs = glob
    .sync(`${pathToModules}/**/*.graphql`)
    .map(file => fs.readFileSync(file, { encoding: 'utf8' }));

  const resolvers = glob
    .sync(`${pathToModules}/**/resolvers.?s`)
    .map(resolver => require(resolver).resolvers);

  return makeExecutableSchema({
    typeDefs: mergeTypes(typeDefs),
    resolvers: mergeResolvers(resolvers),
  });
};

export default generateSchema;
