import { Resolver, GraphQLMiddlewareFunc } from '../types/graphql-utils';

const createMiddleware = (
  middlewareFunc: GraphQLMiddlewareFunc,
  resolverFunc: Resolver
) => (parent: any, args: any, context: any, info: any) =>
  middlewareFunc(resolverFunc, parent, args, context, info);

export default createMiddleware;
