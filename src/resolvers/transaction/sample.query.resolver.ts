import { Authorized, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";

@Service()
@Resolver()
export class SampleResolver {
  @Authorized()
  @Query(() => String, { nullable: true })
  async hello(): Promise<string> {
    console.log("prismaClient", prismaClient);

    return "hello world";
  }
}
