/* eslint-disable simple-import-sort/imports */
import "reflect-metadata";

import { prismaClient } from "src/lib/prisma";
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginUsageReporting,
  ApolloServerPluginCacheControl,
} from "apollo-server-core";
import { ApolloServer } from "apollo-server-lambda";
import ApolloServerPluginResponseCache from "apollo-server-plugin-response-cache";
import { plugin as ApolloServerPluginTracing } from "apollo-tracing";
import CaverExtKas from "caver-js-ext-kas";

import { IContext } from "src/common/interfaces/context";
import { schema } from "src/resolvers";
import { ApolloServerPlugin } from "apollo-server-plugin-base";

const { KAS_ACCESS_KEY, KAS_CHAIN_ID, KAS_SECRET_ACCESS_KEY } = process.env;

const server = new ApolloServer({
  context: async ({
    event: {
      headers: { Authorization },
    },
  }): Promise<IContext> => {
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
  plugins: [
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
    ApolloServerPluginTracing() as ApolloServerPlugin, // 로컬에서 tracing 가능
    ApolloServerPluginResponseCache(), // @CacheControl decorator 사용 가능
    ApolloServerPluginCacheControl({ defaultMaxAge: 10 * 1000 }), // 캐시 세팅
    ApolloServerPluginUsageReporting({
      sendHeaders: { all: true },
      sendVariableValues: { all: true }, // apollo-studio 에 headers, values 데이터 포함하여 리포트
      generateClientInfo: ({ request }) => {
        const headers = request.http && (request.http.headers as any);

        if (headers) {
          return {
            clientName: headers["apollographql-client-name"],
            clientVersion: headers["apollographql-client-version"],
          };
        } else {
          return {
            clientName: "Unknown Client",
            clientVersion: "Unversioned",
          };
        }
      },
    }),
  ],
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
