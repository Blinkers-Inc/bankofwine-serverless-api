import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { getVaultDetailByAttributes } from "src/helpers/get-detail-by-attributes";
import { Nft_con_edition, Nft_con_metadata } from "src/prisma";
import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { NftConEditionsInput } from "src/resolvers/databases/nft-con-edition/dto/query/nft-con-editions.dto";
import {
  PurchasableEdition,
  PurchasableEditionsInput,
  PurchasableEditionsOutput,
} from "src/resolvers/databases/nft-con-edition/dto/query/purchasable-editions.dto";
import {
  RecentMintingEdition,
  RecentMintingEditionsInput,
} from "src/resolvers/databases/nft-con-edition/dto/query/recent-minting-editions.dto";
import { NftConEditionFieldResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.field.resolver";
import { Tier } from "src/resolvers/vault/dto/vault-raw-related-editions.dto";

@Service()
@Resolver(Nft_con_edition)
export class NftConEditionQueryResolver {
  constructor(
    private nft_con_edition_field_resolver: NftConEditionFieldResolver
  ) {}

  @Query(() => Nft_con_edition)
  async nft_con_edition(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_edition> {
    return prismaClient.nft_con_edition.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [Nft_con_edition], { defaultValue: [] })
  async nft_con_editions(
    @Arg("input") { skip, take, nft_con_uuid }: NftConEditionsInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_edition[]> {
    return prismaClient.nft_con_edition.findMany({
      where: {
        nft_con_uuid,
      },
      orderBy: {
        edition_no: "asc",
      },
      skip,
      take,
    });
  }

  @Query(() => [RecentMintingEdition])
  @Directive("@cacheControl(maxAge:0)")
  async recent_minting_editions(
    @Arg("input")
    { from_timestamp, to_timestamp }: RecentMintingEditionsInput,
    @Ctx() ctx: IContext
  ): Promise<RecentMintingEdition[]> {
    const editionsOrderByMintingAt =
      // minting_at, nft_con_uuid가 동일한 리스트를 묶음
      await ctx.prismaClient.nft_con_edition.groupBy({
        by: ["minting_at", "nft_con_uuid"],
        orderBy: {
          minting_at: "desc",
        },
        where: {
          AND: [
            {
              nft_con_info: {
                tier: {
                  not: "EVENT",
                },
                is_active: true,
              },
            }, // EVENT 제외 (PUBLIC, SPCL, OG)
            {
              minting_at: {
                gte: new Date(from_timestamp as number),
              }, // 1 month before
            },
            {
              minting_at: {
                lte: new Date(to_timestamp as number),
              }, // 1 weak later
            },
          ],
        },
      });

    // edition리스트로 맵핑
    const mappedEditionsList = await Promise.all(
      editionsOrderByMintingAt.map((ele) => {
        const { minting_at, nft_con_uuid } = ele;
        return ctx.prismaClient.nft_con_edition.findMany({
          where: {
            minting_at,
            nft_con_uuid,
            is_active: true,
          },
          orderBy: {
            edition_no: "asc",
          },
        });
      })
    );

    const purchasableAmounts: number[] = [];
    const purchasableEditions: Nft_con_edition[][] = [];

    // 맵핑한 리스트 중 상태가 구매가능한 것만 필터링
    const availableEditionsList = mappedEditionsList.reduce(
      (acc, cur, index) => {
        const filterByStatus = cur.filter(
          ({ status }) => status === "AVAILABLE"
        );

        // 해당 인덱스에 맞는 에디션으로
        acc.push(mappedEditionsList[index][0]);
        purchasableAmounts.push(filterByStatus.length);
        purchasableEditions.push(filterByStatus);
        return acc;
      },
      [] as Nft_con_edition[]
    );

    // 각 에디션별 필요한 데이터를 추출
    const nftConEditions = await Promise.all(
      availableEditionsList.map(({ uuid }) => {
        return ctx.prismaClient.nft_con_edition.findUniqueOrThrow({
          where: { uuid },
          include: {
            nft_con_info: {
              include: {
                metadata: {
                  include: { attributes: true },
                },
              },
            },
          },
        });
      })
    );

    const recentMintingEditions = nftConEditions.reduce((acc, cur, index) => {
      const nft_con_info = cur.nft_con_info;
      const attributes = nft_con_info.metadata?.attributes;
      const metadata = nft_con_info.metadata;

      if (!attributes || !attributes.length) {
        return acc;
      }

      const vaultDetail = getVaultDetailByAttributes({
        metadata: metadata as Nft_con_metadata,
        attributes,
      });

      const recentMintingEdition: RecentMintingEdition = {
        nft_con_uuid: nft_con_info.uuid,
        minting_at: cur.minting_at,
        minting_price: Number(cur.price),
        purchasable_amount: purchasableAmounts[index],
        purchasable_editions: purchasableEditions[index],
        img_url: nft_con_info.gif_url!,
        tier: nft_con_info.tier as Tier,
        short_name: nft_con_info.short_name,
        ...vaultDetail,
      };

      acc.push(recentMintingEdition);
      return acc;
    }, [] as RecentMintingEdition[]);

    return recentMintingEditions;
  }

  @Query(() => PurchasableEditionsOutput)
  @Directive("@cacheControl(maxAge:0)")
  async purchasable_editions(
    @Arg("input") { skip = 0, take = 12 }: PurchasableEditionsInput,
    @Ctx() ctx: IContext
  ): Promise<PurchasableEditionsOutput> {
    const totalEditions =
      // is_active 상태의 모든 에디션 리스트 호출
      await ctx.prismaClient.nft_con_edition.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          minting_at: "desc",
        },
        include: {
          nft_con_info: {
            include: {
              metadata: {
                include: {
                  attributes: true,
                },
              },
            },
          },
        },
      });

    const statusByEditions = await Promise.all(
      totalEditions.map((edition) =>
        this.nft_con_edition_field_resolver.status(edition, ctx)
      )
    );

    const filtered = totalEditions.filter(
      (_, index) =>
        statusByEditions[index] === NftConEditionPurchasableStatus.PURCHASABLE
    ); // 구매가능한 NFT 만 필터링

    // TODO 리스팅시점(민팅 또는 리스팅시점), 구매가능가격(민팅 또는 리스팅가) 여기서 가져오면 좋을 듯

    const sorted = filtered.sort((a, b) => {
      // TODO : 민팅시점 -> 숏네임 -> edition_no 순으로 정렬
      const aShortName = a.nft_con_info.short_name;
      const bShortName = b.nft_con_info.short_name;

      if (aShortName === bShortName) {
        return Number(a.edition_no) - Number(b.edition_no);
      }

      return aShortName.localeCompare(bShortName);
    }); // short_name asc - 같을 경우 edition_no asc

    const sliced = sorted.slice(skip, take);
    const editions = sliced.reduce((acc, cur) => {
      const nft_con_info = cur.nft_con_info;
      const attributes = nft_con_info.metadata?.attributes;
      const metadata = nft_con_info.metadata;

      if (!attributes || !attributes.length) {
        return acc;
      }

      const vaultDetail = getVaultDetailByAttributes({
        metadata: metadata as Nft_con_metadata,
        attributes,
      });

      const purchasableEdition: PurchasableEdition = {
        nft_con_edition_uuid: cur.uuid,
        nft_con_uuid: nft_con_info.uuid,
        minting_price: Number(cur.price), // TODO: 구매가능한 금액으로 변경해야함 (리스팅 또는 민팅가)
        minting_at: cur.minting_at, // TODO: 리스팅한 시간 또는 민팅 시간으로 정렬해야 하는데..
        img_url: nft_con_info.gif_url!,
        tier: nft_con_info.tier as Tier,
        short_name: nft_con_info.short_name,
        edition_no: Number(cur.edition_no),
        ...vaultDetail,
      };

      acc.push(purchasableEdition);
      return acc;
    }, [] as PurchasableEdition[]);

    return {
      total_count: sorted.length,
      editions,
    };
  }
}

// TODO : 히스토리 구현해야함
// TODO : 리스팅 구현해야함
// TODO : 리스팅 취소 구현해야함
// TODO : 리스팅 수정 구현해야함
// TODO : 엣치케이스로 인해 발생하는 리스팅 자동취소? 구현해야 함
// TODO : 상세페이지 구현해야함
