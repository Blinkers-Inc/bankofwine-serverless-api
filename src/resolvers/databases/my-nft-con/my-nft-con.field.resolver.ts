import { Arg, Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { IContext } from "src/common/interfaces/context";
import { Member, My_mnft, My_nft_con, Nft_con_edition } from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyMnftOfMyNftConInput } from "src/resolvers/databases/my-nft-con/dto/field/my-mnft.dto";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";

@Service()
@Resolver(My_nft_con)
export class MyNftConFieldResolver {
  constructor(
    private member_query_resolver: MemberQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver
  ) {}

  @FieldResolver(() => Member, {
    description: "최초 민팅한 유저, 가장 오래된 my_nft_con 을 통해 검증",
  })
  async minting_member(
    @Root() { nft_con_edition_uuid }: My_nft_con,
    @Ctx() ctx: IContext
  ): Promise<Member> {
    const { member_uid } = await ctx.prismaClient.my_nft_con.findFirstOrThrow({
      where: {
        nft_con_edition_uuid,
      },
      orderBy: { created_at: "asc" },
    });

    return this.member_query_resolver.member({ member_uid }, ctx);
  }

  @FieldResolver(() => Member, {
    description: "현재 소유주",
  })
  async current_owner(
    @Root() { member_uid }: My_nft_con,
    @Ctx() ctx: IContext
  ): Promise<Member> {
    return this.member_query_resolver.member({ member_uid }, ctx);
  }

  @FieldResolver(() => Nft_con_edition, { nullable: true })
  async nft_con_edition(
    @Root() { nft_con_edition_uuid }: My_nft_con,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_edition | null> {
    if (!nft_con_edition_uuid) return null;

    return this.nft_con_edition_query_resolver.nft_con_edition(
      { uuid: nft_con_edition_uuid },
      ctx
    );
  }

  @FieldResolver(() => [My_mnft])
  async my_mnfts(
    @Root()
    { member_uid, uuid }: My_nft_con,
    @Arg("input")
    { member_uid: memberUidInput }: MyMnftOfMyNftConInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_mnft[]> {
    const memberUid = memberUidInput ?? member_uid;

    return prismaClient.my_mnft.findMany({
      orderBy: {
        created_at: "asc",
      },
      where: {
        is_active: true,
        mynft_uuid: uuid,
        member_uid: memberUid,
      },
    });
  }

  @FieldResolver(() => String, { nullable: true })
  async token_owner_address(
    @Root()
    { token_id, contract_address }: My_nft_con,
    @Ctx() { caver }: IContext
  ): Promise<string | null> {
    if (!token_id) return null;

    const contractAddress =
      contract_address ?? process.env.PRE_NFT_CONTRACT_ADDRESS;
    const instance = new caver.klay.Contract(ERC721_ABI, contractAddress);
    const convertTokenId = caver.utils.toBN(token_id).toString();

    try {
      return await instance.methods.ownerOf(Number(convertTokenId)).call();
    } catch (err) {
      console.log("err", err);
      return null;
    }
  }
}
