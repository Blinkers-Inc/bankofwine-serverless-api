import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { BOW_NICKNAME } from "src/common/constant";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_edition, Nft_con_info } from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyNftConStatus } from "src/resolvers/databases/my-nft-con/dto/my-nft-con.dto";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";

@Service()
@Resolver(Nft_con_edition)
export class NftConEditionFieldResolver {
  constructor(
    private nft_con_info_query_resolver: NftConInfoQueryResolver,
    private wallet_query_resolver: WalletQueryResolver,
    private member_query_resolver: MemberQueryResolver,
    private my_nft_con_query_resolver: MyNftConQueryResolver
  ) {}

  @FieldResolver(() => Nft_con_info)
  async nft_con_info(
    @Root() { nft_con_uuid }: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_info> {
    return await this.nft_con_info_query_resolver.nft_con_info(
      { uuid: nft_con_uuid },
      ctx
    );
  }

  @FieldResolver(() => Boolean)
  async isValidListing(
    @Root() { nft_con_uuid }: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<boolean> {
    // TODO: 현재 리스팅이 정상적인지 확인 필요함
    // 1. 리스팅 후 유저가 고의적으로 트랜스퍼하는 케이스 고려
    //    - isApprovedForAll을 통해 확인 가능할 듯?
    return false;
  }

  @FieldResolver(() => NftConEditionPurchasableStatus)
  async status(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<NftConEditionPurchasableStatus> {
    const { status, my_nft_con } = root;

    if (status === "AVAILABLE")
      return NftConEditionPurchasableStatus.PURCHASABLE;

    if (
      status === "SOLD" &&
      my_nft_con &&
      my_nft_con.status === MyNftConStatus.PAID &&
      (await this.isValidListing(root, ctx))
    )
      return NftConEditionPurchasableStatus.PURCHASABLE;

    if (
      my_nft_con &&
      (my_nft_con.status === MyNftConStatus.REDEEM_PENDING ||
        my_nft_con.status === MyNftConStatus.REDEEM_COMPLETE ||
        my_nft_con.status === MyNftConStatus.REDEEM_COMPLETE)
    )
      return NftConEditionPurchasableStatus.REDEEMED;

    return NftConEditionPurchasableStatus.SOLD;
  }

  @FieldResolver(() => String)
  async owner_nickname(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const { status, my_nft_con } = root;

    if (status === "AVAILABLE") return BOW_NICKNAME;

    if (my_nft_con) {
      const { member_uid, token_id, contract_address } = my_nft_con;
      const member = await this.member_query_resolver.member(
        { member_uid },
        ctx
      );

      const { nick_nm } = member;

      if (nick_nm) return nick_nm; // 닉네임 있으면 닉네임 리턴

      const tokenOwnerAddress =
        await this.my_nft_con_query_resolver.token_owner_address(
          {
            token_id: token_id ?? undefined,
            contract_address:
              contract_address ?? process.env.PRE_NFT_CONTRACT_ADDRESS,
          },
          ctx
        );

      if (
        tokenOwnerAddress &&
        tokenOwnerAddress !== process.env.BLACK_HOLE_ADDRESS
      )
        return tokenOwnerAddress; // 토큰 주인의 주소가 블랙홀 주소가 아니면 주인 주소 리턴

      const latest_wallet = await this.wallet_query_resolver.latest_wallet(
        { member_uid: member.uid },
        ctx
      );

      if (latest_wallet) return latest_wallet.address; // 최근 연결된 월렛 주소 리턴
    }

    return BOW_NICKNAME; // 케이스에 해당하지 않는 경우 공식 이름 리턴
  }

  @FieldResolver(() => String)
  async owner_address(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const { status, my_nft_con } = root;

    if (status === "AVAILABLE" || !my_nft_con) {
      return process.env.BLACK_HOLE_ADDRESS!; // 상태가 구매가능하거나 my_nft_con이 없는 경우 블랙홀로 보냄
    }

    const { token_id, contract_address } = my_nft_con;

    const tokenOwnerAddress =
      await this.my_nft_con_query_resolver.token_owner_address(
        {
          token_id: token_id ?? undefined,
          contract_address:
            contract_address ?? process.env.PRE_NFT_CONTRACT_ADDRESS,
        },
        ctx
      );

    if (tokenOwnerAddress) return tokenOwnerAddress; // tokenOwnerAddress가 있으면 리턴

    return process.env.BLACK_HOLE_ADDRESS!; // 없는 경우 블랙홀 address 리턴
  }
}
