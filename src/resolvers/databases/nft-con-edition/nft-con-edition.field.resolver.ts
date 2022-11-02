import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { BOW_NICKNAME } from "src/common/constant";
import { IContext } from "src/common/interfaces/context";
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
import { LatestListingInfoOutput } from "src/resolvers/databases/nft-con-edition/dto/field/latest_listing_info.dto";
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

  @FieldResolver(() => My_nft_con, { nullable: true })
  async my_nft_con(
    @Root() { uuid }: Nft_con_edition,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con | null> {
    const myNftCons = await prismaClient.my_nft_con.findMany({
      take: 1,
      where: {
        is_active: true,
        nft_con_edition_uuid: uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!myNftCons.length) {
      return null;
    }

    return myNftCons[0];
  }

  @FieldResolver(() => String)
  async owner_nickname(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const { status } = root;

    if (status === "AVAILABLE") return BOW_NICKNAME;

    const my_nft_con = await this.my_nft_con(root, ctx);

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
            contract_address: contract_address ?? undefined,
          },
          ctx
        );

      if (
        tokenOwnerAddress &&
        tokenOwnerAddress !== process.env.BLACK_HOLE_ADDRESS
      )
        return tokenOwnerAddress; // 토큰 주인의 주소가 블랙홀 주소가 아니면 주인 주소 리턴

      const latest_wallet = await this.wallet_query_resolver.latest_wallet(
        { member_uid },
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
    const { status } = root;
    const my_nft_con = await this.my_nft_con(root, ctx);

    if (status === "AVAILABLE" || !my_nft_con) {
      return process.env.BLACK_HOLE_ADDRESS!; // 상태가 구매가능하거나 my_nft_con이 없는 경우 블랙홀로 보냄
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

    if (tokenOwnerAddress) return tokenOwnerAddress; // tokenOwnerAddress가 있으면 리턴

    return process.env.BLACK_HOLE_ADDRESS!; // 없는 경우 블랙홀 address 리턴
  }

  @FieldResolver(() => NftConEditionPurchasableStatus, {
    description: "에디션의 구매 가능 상태",
  })
  async purchasable_status(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<NftConEditionPurchasableStatus> {
    const { status } = root;
    const my_nft_con = await this.my_nft_con(root, ctx);

    if (status === "AVAILABLE") {
      return NftConEditionPurchasableStatus.PURCHASABLE;
    }

    if (my_nft_con && my_nft_con.is_listing) {
      return NftConEditionPurchasableStatus.PURCHASABLE;
    }

    if (
      my_nft_con &&
      (my_nft_con.status === MyNftConStatus.REDEEM_PENDING ||
        my_nft_con.status === MyNftConStatus.REDEEM_COMPLETE ||
        my_nft_con.status === MyNftConStatus.MNFT_APPLIED)
    ) {
      return NftConEditionPurchasableStatus.REDEEMED;
    }

    return NftConEditionPurchasableStatus.SOLD;
  }

  @FieldResolver(() => LatestListingInfoOutput, {
    description: "에디션의 가장 최근 리스팅 정보 (BOW 소유인 경우 포함)",
  })
  async latest_listing_info(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
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

    const my_nft_con = await this.my_nft_con(root, ctx);

    if (my_nft_con && my_nft_con.is_listing) {
      const [{ status, sub_total, commission, total, created_at }] =
        await ctx.prismaClient.market_trade_log.findMany({
          take: 1,
          where: {
            my_nft_con_uuid: my_nft_con.uuid,
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
    const my_nft_con = await this.my_nft_con(root, ctx);

    if (!my_nft_con) {
      return [];
    }

    const {
      uuid: my_nft_con_uuid,
      created_at,
      updated_at,
      is_active,
      is_delete,
      nft_con_edition_uuid,
      member_uid,
      status,
    } = my_nft_con;

    const marketTradeLogs = await ctx.prismaClient.market_trade_log.findMany({
      where: {
        my_nft_con_uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const { price } = await ctx.prismaClient.nft_con_edition.findUniqueOrThrow({
      where: {
        uuid: nft_con_edition_uuid,
      },
    });

    const mintLog: Market_trade_log = {
      uuid: nft_con_edition_uuid,
      created_at,
      is_active,
      is_delete,
      updated_at: created_at,
      status: "MINT",
      sub_total: price,
      commission: BigInt(0),
      total: price,
      my_nft_con_uuid,
      from: BOW_NICKNAME,
      to: member_uid,
    };

    const marketTradeLogsWithMint = [...marketTradeLogs, mintLog];

    const redeemStatus = [
      MyNftConStatus.MNFT_APPLIED,
      MyNftConStatus.REDEEM_COMPLETE,
      MyNftConStatus.REDEEM_PENDING,
    ];

    if (redeemStatus.includes(status as MyNftConStatus)) {
      const redeemLog: Market_trade_log = {
        uuid: nft_con_edition_uuid,
        created_at: updated_at,
        is_active,
        is_delete,
        updated_at: created_at,
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
    description: "가장 최근 판매 금액, 현재 노출가",
  })
  async current_exposure_price(
    @Root() root: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<number> {
    const { status, price } = root;

    if (status === "AVAILABLE") {
      return Number(price);
    } // 민팅 이후 판매 없는 경우

    const my_nft_con = await this.my_nft_con(root, ctx);

    if (!my_nft_con) {
      return Number(price);
    } // my_nft_con 없는 경우

    const marketTradeLogs = await this.market_trade_logs(root, ctx);

    if (marketTradeLogs[0].status === MarketTradeStatus.LIST) {
      return Number(marketTradeLogs[0].sub_total);
    } // 가장 최근이 Logs가 LIST인 경우 (최근 리스팅가)

    const firstIndex = marketTradeLogs.findIndex((log) =>
      this.validPriceList.includes(log.status as MarketTradeStatus)
    );

    return Number(marketTradeLogs[firstIndex].sub_total); // 거래 또는 민팅가 (BUY, MINT)
  }
}
