import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput } from "src/common/dto/uuid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { My_nft_con } from "src/prisma";

@Service()
@Resolver(My_nft_con)
export class MyNftConQueryResolver {
  @Query(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_con(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con> {
    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [My_nft_con], { defaultValue: [] })
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_cons(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con[]> {
    return prismaClient.my_nft_con.findMany({
      where: { member_uid },
    });
  }
}
