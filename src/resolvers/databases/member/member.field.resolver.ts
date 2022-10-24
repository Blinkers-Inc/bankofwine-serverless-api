import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Deposit, Member, My_mnft, My_nft_con, Wallet } from "src/prisma";
import { MyMnftFieldResolver } from "src/resolvers/databases/my-mnft/my-mnft.field.resolver";
import { MyMnftQueryResolver } from "src/resolvers/databases/my-mnft/my-mnft.query.resolver";
import { MyNftConFieldResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.field.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";

@Service()
@Resolver(Member)
export class MemberFieldResolver {
  constructor(
    private wallet_query_resolver: WalletQueryResolver,
    private my_nft_con_query_resolver: MyNftConQueryResolver,
    private my_mnft_query_resolver: MyMnftQueryResolver,
    private my_nft_con_field_resolver: MyNftConFieldResolver,
    private my_mnft_field_resolver: MyMnftFieldResolver
  ) {}

  @FieldResolver(() => [Wallet])
  async wallets(
    @Root() { uid: member_uid }: Member,
    @Ctx() ctx: IContext
  ): Promise<Wallet[]> {
    return this.wallet_query_resolver.wallets({ member_uid }, ctx);
  }

  @FieldResolver(() => [Deposit])
  async deposits(
    @Root() { uid: member_uid }: Member,
    @Ctx() ctx: IContext
  ): Promise<Deposit[]> {
    return ctx.prismaClient.deposit.findMany({
      where: {
        member_uid,
      },
    });
  }

  @FieldResolver(() => [My_nft_con])
  async my_nft_cons(
    @Root() { uid: member_uid }: Member,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con[]> {
    return this.my_nft_con_query_resolver.my_nft_cons({ member_uid }, ctx);
  }

  @FieldResolver(() => [My_mnft])
  async my_mnfts(
    @Root() { uid: member_uid }: Member,
    @Ctx() ctx: IContext
  ): Promise<My_mnft[]> {
    return this.my_mnft_query_resolver.my_mnfts({ member_uid }, ctx);
  }

  @FieldResolver(() => [String])
  async in_use_addresses(
    @Root() root: Member,
    @Ctx() ctx: IContext
  ): Promise<string[]> {
    // TODO NFT, M-NFT를 민팅했고 보유하고 있는 주소
    const myNfts = await this.my_nft_cons(root, ctx);
    const myMnfts = await this.my_mnfts(root, ctx);

    const myNftOwnerTokenAddresses = await Promise.all(
      myNfts.map((myNft) =>
        this.my_nft_con_field_resolver.token_owner_address(myNft, ctx)
      )
    );

    const myMnftOwnerTokenAddresses = await Promise.all(
      myMnfts.map((myMnft) =>
        this.my_mnft_field_resolver.token_owner_address(myMnft, ctx)
      )
    );

    const rawAddresses = [
      ...new Set([...myNftOwnerTokenAddresses, ...myMnftOwnerTokenAddresses]),
    ];

    return rawAddresses.filter(
      (address) =>
        address !== null &&
        address.toLowerCase() !== process.env.BLACK_HOLE_ADDRESS?.toLowerCase()
    ) as string[];
  }
}
