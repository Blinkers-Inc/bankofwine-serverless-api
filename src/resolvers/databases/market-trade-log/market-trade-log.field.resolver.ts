import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { BOW_NICKNAME } from "src/common/constant";
import { IContext } from "src/common/interfaces/context";
import { Market_trade_log } from "src/prisma";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";

@Service()
@Resolver(Market_trade_log)
export class MarketTradeLogFieldResolver {
  constructor(private wallet_query_resolver: WalletQueryResolver) {}

  @FieldResolver(() => String, { nullable: true })
  async from_nickname(
    @Root() { from }: Market_trade_log,
    @Ctx() { prismaClient }: IContext
  ): Promise<string | null> {
    if (!from || from === BOW_NICKNAME) {
      return from;
    }

    const { nick_nm } = await prismaClient.member.findUniqueOrThrow({
      where: {
        uid: from,
      },
    });

    return nick_nm;
  }

  @FieldResolver(() => String, { nullable: true })
  async from_wallet_address(
    @Root() { from }: Market_trade_log,
    @Ctx() ctx: IContext
  ): Promise<string | null> {
    if (!from) {
      return null;
    }

    if (from === BOW_NICKNAME) {
      return process.env.BLACK_HOLE_ADDRESS ?? null;
    }

    const latestWallet = await this.wallet_query_resolver.latest_wallet(
      {
        member_uid: from,
      },
      ctx
    );

    if (!latestWallet) {
      return null;
    }

    return latestWallet.address;
  }

  @FieldResolver(() => String, { nullable: true })
  async to_nickname(
    @Root() { to }: Market_trade_log,
    @Ctx() { prismaClient }: IContext
  ): Promise<string | null> {
    if (!to || to === BOW_NICKNAME) {
      return to ?? null;
    }

    const { nick_nm } = await prismaClient.member.findUniqueOrThrow({
      where: {
        uid: to,
      },
    });

    return nick_nm;
  }

  @FieldResolver(() => String, { nullable: true })
  async to_wallet_address(
    @Root() { to }: Market_trade_log,
    @Ctx() ctx: IContext
  ): Promise<string | null> {
    if (!to) {
      return null;
    }

    if (to === BOW_NICKNAME) {
      return process.env.BLACK_HOLE_ADDRESS ?? null;
    }

    const latestWallet = await this.wallet_query_resolver.latest_wallet(
      {
        member_uid: to,
      },
      ctx
    );

    if (!latestWallet) {
      return null;
    }

    return latestWallet.address;
  }
}
