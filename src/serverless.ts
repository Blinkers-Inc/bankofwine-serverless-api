import { PrismaClient } from "@prisma/client";
import { ApolloServer, gql } from "apollo-server-lambda";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import CaverExtKas from "caver-js-ext-kas";
// import typeDefs from "./src/graphql/schema";
// import resolvers from "./src/graphql/resolvers";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
    banners: String
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => "Hello world!",
    banners: async (parent: any, args: any, context: any) => {
      const client = await context.prismaClient();
      const allBanners = await client.banner.findMany();
      console.log("allBanners", allBanners);

      return JSON.stringify(allBanners);
    },
  },
};

const connectPrismaClient = async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  return prisma;
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    prismaClient: connectPrismaClient,
  },
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // install the Playground plugin and set the `introspection` option explicitly to `true`.
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

exports.handler = server.createHandler({
  expressGetMiddlewareOptions: {
    cors: {
      origin: true,
      credentials: true,
    },
  },
});
