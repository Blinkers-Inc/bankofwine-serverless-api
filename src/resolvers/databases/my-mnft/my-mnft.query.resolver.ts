import { Arg, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput } from "src/common/dto/uuid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { prismaClient } from "src/lib/prisma";
import { My_mnft } from "src/prisma";

@Service()
@Resolver(My_mnft)
export class MyMnftQueryResolver {
  @Query(() => My_mnft)
  @Directive("@cacheControl(maxAge:0)")
  async my_mnft(@Arg("input") { uuid }: UuidInput): Promise<My_mnft> {
    return prismaClient.my_mnft.findUniqueOrThrow({
      where: { uuid },
      include: {
        my_nft_con: true,
        member: true,
        participant: true,
      },
    });
  }

  @Query(() => [My_mnft], { defaultValue: [] })
  @Directive("@cacheControl(maxAge:0)")
  async my_mnfts(
    @Arg("input") { member_uid }: MemberUidInput
  ): Promise<My_mnft[]> {
    return prismaClient.my_mnft.findMany({
      where: { is_active: true, member_uid },
      orderBy: {
        created_at: "desc",
      },
      include: {
        my_nft_con: true,
        member: true,
        participant: true,
      },
    });
  }
}
