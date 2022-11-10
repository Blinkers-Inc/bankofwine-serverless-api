/* eslint-disable simple-import-sort/imports */
import "reflect-metadata";

import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginSchemaReporting,
  ApolloServerPluginUsageReporting,
  ApolloServerPluginCacheControl,
} from "apollo-server-core";

import { ApolloServer } from "apollo-server-lambda";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import ApolloServerPluginResponseCache from "apollo-server-plugin-response-cache";
import { plugin as ApolloServerPluginTracing } from "apollo-tracing";
import CaverExtKas from "caver-js-ext-kas";

import { IContext } from "src/common/interfaces/context";
import { schema } from "src/resolvers";
import { sendCustomError } from "src/common/slack";
import { Context } from "aws-lambda";

const { KAS_ACCESS_KEY, KAS_CHAIN_ID, KAS_SECRET_ACCESS_KEY } = process.env;

let plugins = [
  !process.env.IS_OFFLINE
    ? ApolloServerPluginLandingPageDisabled()
    : ApolloServerPluginLandingPageGraphQLPlayground(),
  ApolloServerPluginTracing() as ApolloServerPlugin, // 로컬에서 tracing 가능
  ApolloServerPluginResponseCache(), // @CacheControl decorator 사용 가능
  ApolloServerPluginCacheControl({ defaultMaxAge: 10 }), // 캐시 세팅
  ApolloServerPluginUsageReporting({
    sendReportsImmediately: true,
    sendHeaders: { all: true },
    sendVariableValues: { all: true }, // apollo-studio 에 headers, values 데이터 포함하여 리포트
  }),
];

if (!process.env.IS_OFFLINE) {
  plugins = [
    ...plugins,
    ApolloServerPluginSchemaReporting({
      initialDelayMaxMs: 10,
    }),
  ];
}

const server = new ApolloServer({
  context: async ({
    event: {
      headers: { Authorization },
    },
    context,
  }): Promise<IContext> => {
    context.callbackWaitsForEmptyEventLoop = false;

    const caver = new CaverExtKas(
      KAS_CHAIN_ID,
      KAS_ACCESS_KEY,
      KAS_SECRET_ACCESS_KEY
    );

    return { Authorization, caver };
  },
  introspection: true,
  plugins,
  schema,
  formatError: (err) => {
    console.log("Error :>> ", err);

    const { message, path } = err;
    const { code, exception } = err.extensions;
    const { errorCode, data } = exception;

    if (!process.env.IS_OFFLINE) {
      sendCustomError({
        message,
        code,
        path,
        errorCode,
        data,
      });
    }

    return err;
  },
});

exports.handler = (event: any, context: Context, callback: any) => {
  // Set to false to send the response right away when the callback executes, instead of waiting for the Node.js event loop to be empty.
  context.callbackWaitsForEmptyEventLoop = false;

  return server.createHandler({
    expressGetMiddlewareOptions: {
      cors: {
        credentials: true,
        origin: true,
      },
    },
  })(event, context, callback);
};
