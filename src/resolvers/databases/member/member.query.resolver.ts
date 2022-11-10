import { Arg, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { PaginationInput } from "src/common/dto/pagination.input";
import { MemberUidInput } from "src/common/dto/uuid.input";
import { prismaClient } from "src/lib/prisma";
import { Member } from "src/prisma";

@Service()
@Resolver(Member)
export class MemberQueryResolver {
  @Query(() => Member, { name: "member" })
  async member(@Arg("input") { member_uid }: MemberUidInput): Promise<Member> {
    return prismaClient.member.findUniqueOrThrow({
      where: { uid: member_uid },
    });
  }

  @Query(() => [Member], { defaultValue: [], name: "members" })
  async members(
    @Arg("input") { skip, take }: PaginationInput
  ): Promise<Member[]> {
    return prismaClient.member.findMany({
      where: {
        is_active: true,
      },
      skip,
      take,
    });
  }
}
