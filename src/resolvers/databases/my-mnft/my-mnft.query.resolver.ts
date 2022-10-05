import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput } from "src/common/dto/uuid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { My_mnft } from "src/prisma";

@Service()
@Resolver(My_mnft)
export class MyMnftQueryResolver {
  @Query(() => My_mnft)
  async my_mnft(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_mnft> {
    return prismaClient.my_mnft.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [My_mnft], { defaultValue: [] })
  async my_mnfts(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_mnft[]> {
    return prismaClient.my_mnft.findMany({
      where: { member_uid },
    });
  }
}
