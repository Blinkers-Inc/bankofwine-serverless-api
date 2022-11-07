import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { IContext } from "src/common/interfaces/context";
import {
  Deposit,
  MarketTradeStatus,
  Member,
  My_mnft,
  My_nft_con,
  Wallet,
} from "src/prisma";
import {
  TradeLog,
  TradeLogOutput,
} from "src/resolvers/databases/member/dto/field/trade-log.dto";
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

  @FieldResolver(() => Deposit)
  async deposit(
    @Root() input: Member,
    @Ctx() { prismaClient }: IContext
  ): Promise<Deposit> {
    const { uid: member_uid } = input;
    const deposit = await prismaClient.deposit.findFirst({
      orderBy: {
        updated_at: "desc",
      },
      where: {
        is_active: true,
        member_uid,
      },
    });

    if (!deposit) {
      const newDepositUuid = uuid();
      const now = new Date();
      const zeroBigInt = BigInt(0);

      await prismaClient.deposit.create({
        data: {
          uuid: newDepositUuid,
          created_at: now,
          is_active: true,
          is_delete: false,
          updated_at: now,
          avail_deposit_sum: zeroBigInt,
          deposit_sum: zeroBigInt,
          pending_deposit_sum: zeroBigInt,
          pending_withdraw_sum: zeroBigInt,
          member_uid,
        },
      });

      return prismaClient.deposit.findUniqueOrThrow({
        where: { uuid: newDepositUuid },
      });
    }

    return deposit;
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

  @FieldResolver(() => TradeLogOutput)
  async trade_log(
    @Root() root: Member,
    @Ctx() ctx: IContext
  ): Promise<TradeLogOutput> {
    const { uid } = root;
    const { prismaClient } = ctx;

    const tradeTxs = await prismaClient.trade_tx.findMany({
      take: 10_000,
      where: {
        is_active: true,
        member_uid: uid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const mappingTradeTxs: TradeLog[] = tradeTxs.map((tradeTx) => {
      return {
        uuid: tradeTx.uuid,
        created_at: tradeTx.created_at,
        price: Number(tradeTx.amount),
        status: MarketTradeStatus.PURCHASE,
        nft_con_edition_uuid: tradeTx.item_uuid,
      };
    });

    const marketTradeTxs = await prismaClient.market_trade_tx.findMany({
      take: 10_000,
      where: { is_active: true, OR: [{ buyer_uid: uid }, { seller_uid: uid }] },
      orderBy: { created_at: "desc" },
    });

    const mappingMarketTradeTxs: TradeLog[] = marketTradeTxs.map(
      (marketTradeTx) => {
        if (marketTradeTx.buyer_uid === uid) {
          return {
            uuid: marketTradeTx.uuid,
            created_at: marketTradeTx.created_at,
            price: Number(marketTradeTx.buyer_spend),
            status: MarketTradeStatus.PURCHASE,
            nft_con_edition_uuid: marketTradeTx.nft_con_edition_uuid,
          };
        } else {
          return {
            uuid: marketTradeTx.uuid,
            created_at: marketTradeTx.created_at,
            price: Number(marketTradeTx.seller_earn),
            status: MarketTradeStatus.SELL,
            nft_con_edition_uuid: marketTradeTx.nft_con_edition_uuid,
          };
        }
      }
    );

    const list = [...mappingTradeTxs, ...mappingMarketTradeTxs].sort((a, b) => {
      const aCreatedAt = new Date(a.created_at).valueOf();
      const bCreatedAt = new Date(b.created_at).valueOf();

      return bCreatedAt - aCreatedAt;
    });

    const prices = list.reduce(
      (acc, cur) => {
        if (cur.status === MarketTradeStatus.PURCHASE) {
          acc.total_purchase_price += cur.price;
        } else {
          acc.total_sell_price += cur.price;
        }

        return acc;
      },
      {
        total_purchase_price: 0,
        total_sell_price: 0,
      }
    );

    return { list, ...prices };
  }
}
