import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

const log: Prisma.LogLevel[] = ["info"];

if (process.env.IS_OFFLINE) {
  log.push("query");
}

export const prismaClient =
  global.prismaClient ||
  new PrismaClient({
    log,
  });

if (process.env.NODE_ENV !== "production") global.prismaClient = prismaClient;
