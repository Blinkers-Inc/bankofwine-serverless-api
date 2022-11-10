import { FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { BOW_NICKNAME } from "src/common/constant";
import { Market_trade_log } from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";

@Service()
@Resolver(Market_trade_log)
export class MarketTradeLogFieldResolver {
  constructor(
    private member_query_resolver: MemberQueryResolver,
    private wallet_query_resolver: WalletQueryResolver
  ) {}

  @FieldResolver(() => String, { nullable: true })
  async from_nickname(
    @Root() { from }: Market_trade_log
  ): Promise<string | null> {
    if (!from || from === BOW_NICKNAME) {
      return from;
    }

    const { nick_nm } = await this.member_query_resolver.member({
      member_uid: from,
    });

    return nick_nm ?? null;
  }

  @FieldResolver(() => String, { nullable: true })
  async from_wallet_address(
    @Root() { from }: Market_trade_log
  ): Promise<string | null> {
    if (!from) {
      return null;
    }

    if (from === BOW_NICKNAME) {
      return process.env.BLACK_HOLE_ADDRESS ?? null;
    }

    const latestWallet = await this.wallet_query_resolver.latest_wallet({
      member_uid: from,
    });

    if (!latestWallet) {
      return null;
    }

    return latestWallet.address;
  }

  @FieldResolver(() => String, { nullable: true })
  async to_nickname(@Root() { to }: Market_trade_log): Promise<string | null> {
    if (!to || to === BOW_NICKNAME) {
      return to ?? null;
    }

    const { nick_nm } = await this.member_query_resolver.member({
      member_uid: to,
    });

    return nick_nm ?? null;
  }

  @FieldResolver(() => String, { nullable: true })
  async to_wallet_address(
    @Root() { to }: Market_trade_log
  ): Promise<string | null> {
    if (!to) {
      return null;
    }

    if (to === BOW_NICKNAME) {
      return process.env.BLACK_HOLE_ADDRESS ?? null;
    }

    const latestWallet = await this.wallet_query_resolver.latest_wallet({
      member_uid: to,
    });

    if (!latestWallet) {
      return null;
    }

    return latestWallet.address;
  }
}
