import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { IContext } from "src/common/interfaces/context";
import { Member, My_nft_con, Nft_con_edition } from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";

@Service()
@Resolver(My_nft_con)
export class MyNftConFieldResolver {
  constructor(
    private member_query_resolver: MemberQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver
  ) {}

  @FieldResolver(() => Member)
  async member(
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

  @FieldResolver(() => String, { nullable: true })
  async token_owner_address(
    @Root()
    {
      token_id,
      contract_address = process.env.PRE_NFT_CONTRACT_ADDRESS,
    }: My_nft_con,
    @Ctx() { caver }: IContext
  ): Promise<string | null> {
    if (!token_id) return null;

    const instance = new caver.klay.Contract(ERC721_ABI, contract_address);
    const convertTokenId = caver.utils.toBN(token_id).toString();

    try {
      return await instance.methods.ownerOf(Number(convertTokenId)).call();
    } catch {
      return null;
    }
  }
}
