import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { PaginationInput } from "src/common/dto/pagination.input";
import { MemberUidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { Member } from "src/prisma";

@Service()
@Resolver(Member)
export class MemberQueryResolver {
  @Query(() => Member)
  async member(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Member> {
    return prismaClient.member.findUniqueOrThrow({
      where: { uid: member_uid },
    });
  }

  @Query(() => [Member], { defaultValue: [] })
  async members(
    @Arg("input") { skip, take }: PaginationInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Member[]> {
    return prismaClient.member.findMany({
      skip,
      take,
    });
  }
}
