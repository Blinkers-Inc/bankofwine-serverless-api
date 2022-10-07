import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Member, My_mnft, My_nft_con, Participant } from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";

@Service()
@Resolver(My_mnft)
export class MyMnftFieldResolver {
  constructor(
    private my_nft_con_query_resolver: MyNftConQueryResolver,
    private member_query_resolver: MemberQueryResolver
  ) {}

  @FieldResolver(() => My_nft_con)
  async my_nft_con(
    @Root() { mynft_uuid }: My_mnft,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    return this.my_nft_con_query_resolver.my_nft_con({ uuid: mynft_uuid }, ctx);
  }

  @FieldResolver(() => Member)
  async member(
    @Root() { member_uid }: My_mnft,
    @Ctx() ctx: IContext
  ): Promise<Member> {
    return this.member_query_resolver.member({ member_uid }, ctx);
  }

  @FieldResolver(() => Participant)
  async participant(
    @Root() { uuid }: My_mnft,
    @Ctx() { prismaClient }: IContext
  ): Promise<Participant> {
    return (
      await prismaClient.participant.findMany({
        where: { my_mnft_uuid: uuid },
      })
    )[0];
  }
}
