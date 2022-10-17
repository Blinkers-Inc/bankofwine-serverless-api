import { Authorized, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";

@Service()
@Resolver()
export class SampleResolver {
  @Authorized()
  @Query(() => String, { nullable: true })
  async hello(@Ctx() { prismaClient }: IContext): Promise<string> {
    console.log("prismaClient", prismaClient);

    return "hello world";
  }
}
