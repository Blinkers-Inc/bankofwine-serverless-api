import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { BOW_NICKNAME } from "src/common/constant";
import { IContext } from "src/common/interfaces/context";
import { prismaClient } from "src/lib/prisma";
import {
  Market_trade_log,
  MarketTradeStatus,
  My_nft_con,
  Nft_con_edition,
  Nft_con_info,
} from "src/prisma";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyNftConStatus } from "src/resolvers/databases/my-nft-con/dto/query/my-nft-con.dto";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { LatestListingInfoOutput } from "src/resolvers/databases/nft-con-edition/dto/field/latest-listing-info.dto";
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
    @Root() { nft_con_uuid }: Nft_con_edition
  ): Promise<Nft_con_info> {
    return this.nft_con_info_query_resolver.nft_con_info({
      uuid: nft_con_uuid,
    });
  }

  @FieldResolver(() => My_nft_con, { nullable: true })
  async my_nft_con(
    @Root() { uuid }: Nft_con_edition
  ): Promise<My_nft_con | null> {
    const myNftCon = await prismaClient.my_nft_con.findFirst({
      where: {
        is_active: true,
        nft_con_edition_uuid: uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!myNftCon) {
      return null;
    }

    return myNftCon;
  }

  @FieldResolver(() => String)
  async owner_nickname(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const { status } = root;

    if (status === "AVAILABLE") return BOW_NICKNAME;

    const my_nft_con = await this.my_nft_con(root);

    if (my_nft_con) {
      const { member_uid, token_id, contract_address } = my_nft_con;

      const member = await this.member_query_resolver.member({ member_uid });

      const { nick_nm } = member;

      if (nick_nm) return nick_nm; // ????????? ????????? ????????? ??????

      const tokenOwnerAddress =
        await this.my_nft_con_query_resolver.token_owner_address(
          {
            token_id: token_id ?? undefined,
            contract_address: contract_address ?? undefined,
          },
          ctx
        );

      if (
        tokenOwnerAddress &&
        tokenOwnerAddress !== process.env.BLACK_HOLE_ADDRESS
      )
        return tokenOwnerAddress; // ?????? ????????? ????????? ????????? ????????? ????????? ?????? ?????? ??????

      const latest_wallet = await this.wallet_query_resolver.latest_wallet({
        member_uid,
      });

      if (latest_wallet) return latest_wallet.address; // ?????? ????????? ?????? ?????? ??????
    }

    return BOW_NICKNAME; // ???????????? ???????????? ?????? ?????? ?????? ?????? ??????
  }

  @FieldResolver(() => String)
  async owner_address(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const { status } = root;
    const my_nft_con = await this.my_nft_con(root);

    if (status === "AVAILABLE" || !my_nft_con) {
      return process.env.BLACK_HOLE_ADDRESS!; // ????????? ????????????????????? my_nft_con??? ?????? ?????? ???????????? ??????
    }

    const { token_id, contract_address } = my_nft_con;

    const tokenOwnerAddress =
      await this.my_nft_con_query_resolver.token_owner_address(
        {
          token_id: token_id ?? undefined,
          contract_address: contract_address ?? undefined,
        },
        ctx
      );

    if (tokenOwnerAddress) return tokenOwnerAddress; // tokenOwnerAddress??? ????????? ??????

    return process.env.BLACK_HOLE_ADDRESS!; // ?????? ?????? ????????? address ??????
  }

  @FieldResolver(() => NftConEditionPurchasableStatus, {
    description: "???????????? ?????? ?????? ??????",
  })
  async purchasable_status(
    @Root() root: Nft_con_edition
  ): Promise<NftConEditionPurchasableStatus> {
    const { status } = root;
    const myNftCon = await this.my_nft_con(root);

    if (status === "AVAILABLE") {
      return NftConEditionPurchasableStatus.PURCHASABLE;
    } // edition ????????? AVAILABLE ??? ??????

    if (
      myNftCon &&
      (myNftCon.status === MyNftConStatus.REDEEM_PENDING ||
        myNftCon.status === MyNftConStatus.REDEEM_COMPLETE ||
        myNftCon.status === MyNftConStatus.MNFT_APPLIED)
    ) {
      return NftConEditionPurchasableStatus.REDEEMED;
    } // myNftCon ????????? REDEEM ?????? ???????????????

    if (myNftCon && myNftCon.is_burnt) {
      return NftConEditionPurchasableStatus.REDEEMED;
    } // ???????????? ????????? ?????? ??????????????????(REDEEM) ?????? ?????? ??????

    if (myNftCon && myNftCon.is_listing) {
      return NftConEditionPurchasableStatus.PURCHASABLE;
    } // ??? ????????? ????????? is_listing??? true??? ??????

    return NftConEditionPurchasableStatus.SOLD;
  }

  @FieldResolver(() => LatestListingInfoOutput, {
    description: "???????????? ?????? ?????? ????????? ?????? (BOW ????????? ?????? ??????)",
  })
  async latest_listing_info(
    @Root() root: Nft_con_edition
  ): Promise<LatestListingInfoOutput> {
    const { status, price, minting_at } = root;
    if (status === "AVAILABLE") {
      return {
        sub_total: Number(price),
        commission: 0,
        total: Number(price),
        listing_at: minting_at,
        is_listing: false,
        is_purchasable: true,
      };
    }

    const myNftCon = await this.my_nft_con(root);

    if (myNftCon && myNftCon.is_listing) {
      const { status, sub_total, commission, total, created_at } =
        await prismaClient.market_trade_log.findFirstOrThrow({
          where: {
            is_active: true,
            my_nft_con_uuid: myNftCon.uuid,
          },
          orderBy: {
            created_at: "desc",
          },
        });

      if (status === MarketTradeStatus.LIST) {
        return {
          sub_total: Number(sub_total),
          commission: Number(commission),
          total: Number(total),
          listing_at: created_at,
          is_listing: true,
          is_purchasable: true,
        };
      }
    }

    return {
      sub_total: 0,
      commission: 0,
      total: 0,
      listing_at: minting_at,
      is_listing: false,
      is_purchasable: false,
    };
  }

  @FieldResolver(() => [Market_trade_log], { defaultValue: [] })
  async market_trade_logs(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<Market_trade_log[]> {
    const currentMyNftCon = await this.my_nft_con(root);

    if (!currentMyNftCon) {
      return [];
    }

    const {
      uuid: my_nft_con_uuid,
      updated_at,
      is_active,
      is_delete,
      nft_con_edition_uuid,
      member_uid,
      status,
      is_burnt,
    } = currentMyNftCon;

    const marketTradeLogs = await prismaClient.market_trade_log.findMany({
      where: {
        is_active: true,
        my_nft_con_uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const { price } = await prismaClient.nft_con_edition.findUniqueOrThrow({
      where: {
        uuid: nft_con_edition_uuid,
      },
    });

    const mintMyNftCon = await prismaClient.my_nft_con.findFirstOrThrow({
      where: {
        nft_con_edition_uuid,
      },
      orderBy: { created_at: "asc" },
    });

    const mintLog: Market_trade_log = {
      uuid: nft_con_edition_uuid,
      created_at: mintMyNftCon.created_at,
      is_active,
      is_delete,
      updated_at: mintMyNftCon.created_at,
      status: "MINT",
      sub_total: price,
      commission: BigInt(0),
      total: price,
      my_nft_con_uuid,
      from: BOW_NICKNAME,
      to: mintMyNftCon.member_uid,
    };

    const marketTradeLogsWithMint = [...marketTradeLogs, mintLog];

    const redeemStatus = [
      MyNftConStatus.MNFT_APPLIED,
      MyNftConStatus.REDEEM_COMPLETE,
      MyNftConStatus.REDEEM_PENDING,
    ];

    if (is_burnt || redeemStatus.includes(status as MyNftConStatus)) {
      const redeemLog: Market_trade_log = {
        uuid: nft_con_edition_uuid,
        created_at: updated_at,
        is_active,
        is_delete,
        updated_at,
        status: "REDEEM",
        sub_total: BigInt(0),
        commission: BigInt(0),
        total: BigInt(0),
        my_nft_con_uuid,
        from: member_uid,
        to: BOW_NICKNAME,
      };

      return [redeemLog, ...marketTradeLogsWithMint];
    }

    return marketTradeLogsWithMint;
  }

  validPriceList = [MarketTradeStatus.PURCHASE, MarketTradeStatus.MINT];

  @FieldResolver(() => Number, {
    description: "?????? ?????? ?????? ??????, ?????? ?????????",
  })
  async current_exposure_price(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<number> {
    const { status, price } = root;

    if (status === "AVAILABLE") {
      return Number(price);
    } // ?????? ?????? ?????? ?????? ??????

    const myNftCon = await this.my_nft_con(root);

    if (!myNftCon) {
      return Number(price);
    } // my_nft_con ?????? ??????

    const marketTradeLogs = await this.market_trade_logs(root, ctx);

    if (marketTradeLogs[0].status === MarketTradeStatus.LIST) {
      return Number(marketTradeLogs[0].sub_total);
    } // ?????? ????????? Logs??? LIST??? ?????? (?????? ????????????)

    const firstIndex = marketTradeLogs.findIndex((log) =>
      this.validPriceList.includes(log.status as MarketTradeStatus)
    );

    return Number(marketTradeLogs[firstIndex].sub_total); // ?????? ?????? ????????? (BUY, MINT)
  }
}
