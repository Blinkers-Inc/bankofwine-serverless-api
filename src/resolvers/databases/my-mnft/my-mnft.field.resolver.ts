import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
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
    @Root() { mynft_uuid, my_nft_con }: My_mnft,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    return (
      my_nft_con ??
      this.my_nft_con_query_resolver.my_nft_con({ uuid: mynft_uuid }, ctx)
    );
  }

  @FieldResolver(() => Member)
  async member(
    @Root() { member_uid, member }: My_mnft,
    @Ctx() ctx: IContext
  ): Promise<Member> {
    return member ?? this.member_query_resolver.member({ member_uid }, ctx);
  }

  @FieldResolver(() => [Participant], { defaultValue: [] })
  async participants(
    @Root() { uuid, participant }: My_mnft,
    @Ctx() { prismaClient }: IContext
  ): Promise<Participant[]> {
    return (
      participant ??
      prismaClient.participant.findMany({
        where: { my_mnft_uuid: uuid },
      })
    );
  }

  @FieldResolver(() => String, { nullable: true })
  async token_owner_address(
    @Root()
    { token_id, contract_address }: My_mnft,
    @Ctx() { caver }: IContext
  ): Promise<string | null> {
    if (!token_id) return null;

    const contractAddress =
      contract_address ?? process.env.PRE_NFT_CONTRACT_ADDRESS;
    const instance = new caver.klay.Contract(ERC721_ABI, contractAddress);
    const convertTokenId = caver.utils.toBN(token_id).toString();

    try {
      return await instance.methods.ownerOf(Number(convertTokenId)).call();
    } catch {
      return null;
    }
  }
}
