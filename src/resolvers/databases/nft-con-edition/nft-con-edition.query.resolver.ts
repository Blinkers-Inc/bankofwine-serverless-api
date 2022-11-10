import { Arg, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { UuidInput } from "src/common/dto/uuid.input";
import { getVaultDetailByAttributes } from "src/helpers/get-detail-by-attributes";
import { prismaClient } from "src/lib/prisma";
import { Nft_con_edition, Nft_con_metadata } from "src/prisma";
import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { NftConEditionsInput } from "src/resolvers/databases/nft-con-edition/dto/query/nft-con-editions.dto";
import {
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
    @Arg("input") { uuid }: UuidInput
  ): Promise<Nft_con_edition> {
    return prismaClient.nft_con_edition.findUniqueOrThrow({
      where: { uuid },
      include: {
        nft_con_info: true,
      },
    });
  }

  @Query(() => [Nft_con_edition], { defaultValue: [] })
  async nft_con_editions(
    @Arg("input") { skip, take, nft_con_uuid }: NftConEditionsInput
  ): Promise<Nft_con_edition[]> {
    return prismaClient.nft_con_edition.findMany({
      include: {
        nft_con_info: true,
      },
      where: {
        is_active: true,
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
    { to_timestamp, take = 12 }: RecentMintingEditionsInput
  ): Promise<RecentMintingEdition[]> {
    const editionsOrderByMintingAt =
      // minting_at, nft_con_uuid가 동일한 리스트를 묶음
      await prismaClient.nft_con_edition.groupBy({
        take, // maximum 12
        by: ["minting_at", "nft_con_uuid"],
        orderBy: {
          minting_at: "desc",
        },
        where: {
          AND: [
            {
              is_active: true,
            },
            {
              minting_at: {
                lte: new Date(to_timestamp as number),
              }, // 1 weak later
            },
            {
              nft_con_info: {
                tier: {
                  not: "EVENT",
                },
                is_active: true,
              },
            }, // EVENT 제외 (PUBLIC, SPCL, OG)
          ],
        },
      });

    // edition리스트로 맵핑
    const mappedEditionsList = await Promise.all(
      editionsOrderByMintingAt.map((ele) => {
        const { minting_at, nft_con_uuid } = ele;
        return prismaClient.nft_con_edition.findMany({
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
        return prismaClient.nft_con_edition.findUniqueOrThrow({
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
        img_url: nft_con_info.img_url!,
        static_diagonal_img_url: nft_con_info.static_diagonal_img_url!,
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
    @Arg("input") { skip = 0, take = 12 }: PurchasableEditionsInput
  ): Promise<PurchasableEditionsOutput> {
    const totalEditions =
      // is_active 상태의 모든 에디션 리스트 호출
      await prismaClient.nft_con_edition.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          minting_at: "desc",
        },
        include: {
          nft_con_info: {
            select: {
              uuid: true,
              is_active: true,
              short_name: true,
            },
          },
        },
      });

    const statusByEditions = await Promise.all(
      totalEditions.map((edition) =>
        this.nft_con_edition_field_resolver.purchasable_status(
          edition as Nft_con_edition
        )
      )
    );

    const filtered = totalEditions.filter(
      (edition, index) =>
        statusByEditions[index] ===
          NftConEditionPurchasableStatus.PURCHASABLE &&
        edition.nft_con_info.is_active === true
    ); // 구매가능한 NFT & nft_con_info 가 is_active 인 edition 만 필터

    const latestListingInfoList = await Promise.all(
      filtered.map((edition) =>
        this.nft_con_edition_field_resolver.latest_listing_info(
          edition as Nft_con_edition
        )
      )
    );

    const mapped = filtered.map((edition, index) => {
      return { ...edition, latestListingInfo: latestListingInfoList[index] };
    }); // latestListingInfoList 추가 (정렬 위함)

    const sorted = mapped.sort((a, b) => {
      // 민팅시점 > 숏네임 > edition_no 순으로 정렬
      const aListingAt = new Date(a.latestListingInfo.listing_at).valueOf();
      const bListingAt = new Date(b.latestListingInfo.listing_at).valueOf();

      if (aListingAt !== bListingAt) {
        return bListingAt - aListingAt;
      }

      const aShortName = a.nft_con_info.short_name;
      const bShortName = b.nft_con_info.short_name;

      if (aShortName !== bShortName) {
        return aShortName.localeCompare(bShortName);
      }

      return Number(a.edition_no) - Number(b.edition_no);
    });

    const sliced = sorted.slice(skip, skip + take);

    return {
      total_count: sorted.length,
      editions: sliced as unknown as Nft_con_edition[],
    };
  }
}
