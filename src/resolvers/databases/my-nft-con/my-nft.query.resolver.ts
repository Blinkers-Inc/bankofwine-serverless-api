import { Service } from "typedi";
import { Arg, Ctx, Query, Resolver } from "type-graphql";

import { MemberUidInput } from "src/common/dto/member-uid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { My_nft_con } from "src/prisma";

@Service()
@Resolver(My_nft_con)
export class MyNftQueryResolver {
  @Query(() => My_nft_con)
  async my_nft_con(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con> {
    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [My_nft_con], { defaultValue: [] })
  async my_nft_cons(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con[]> {
    return prismaClient.my_nft_con.findMany({
      where: { member_uid },
    });
  }
}
