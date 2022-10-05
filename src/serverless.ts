/* eslint-disable simple-import-sort/imports */
import "reflect-metadata";

import { PrismaClient } from "@prisma/client";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-lambda";
import CaverExtKas from "caver-js-ext-kas";

import { IContext } from "src/common/interfaces/context";
import { schema } from "src/resolvers";

const { KAS_ACCESS_KEY, KAS_CHAIN_ID, KAS_SECRET_ACCESS_KEY } = process.env;

const server = new ApolloServer({
  context: async ({
    event: {
      headers: { Authorization },
    },
  }): Promise<IContext> => {
    const prismaClient = new PrismaClient();
    await prismaClient.$connect();

    const caver = new CaverExtKas(
      KAS_CHAIN_ID,
      KAS_ACCESS_KEY,
      KAS_SECRET_ACCESS_KEY
    );

    return { Authorization, caver, prismaClient };
  },
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // install the Playground plugin and set the `introspection` option explicitly to `true`.
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  schema,
});

exports.handler = server.createHandler({
  expressGetMiddlewareOptions: {
    cors: {
      credentials: true,
      origin: true,
    },
  },
});
