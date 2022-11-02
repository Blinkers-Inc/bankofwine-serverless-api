import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import {
  countries,
  NftConEditionPurchasableStatusKr,
  types,
} from "src/common/constant";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_info } from "src/prisma";
import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { NftConEditionFieldResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.field.resolver";
import {
  VaultDetail,
  VaultDetailsInput,
  VaultDetailsOutput,
} from "src/resolvers/vault/dto/vault-details.dto";
import {
  VaultListInput,
  VaultListOutput,
  VaultListSort,
} from "src/resolvers/vault/dto/vault-list.dto";
import {
  Tier,
  VaultRawRelatedEditionsInput,
  VaultRawRelatedEditionsOutput,
  VaultRelatedEdition,
  VaultRelatedEditionsFilter,
} from "src/resolvers/vault/dto/vault-raw-related-editions.dto";
import {
  VaultRelatedEditionsInput,
  VaultRelatedEditionsSort,
} from "src/resolvers/vault/dto/vault-related-editions.dto";

@Service()
@Resolver(Nft_con_info)
export class VaultQueryResolver {
  constructor(
    private nft_con_edition_field_resolver: NftConEditionFieldResolver
  ) {}

  tierSortList = [Tier.OG, Tier.SPCL, Tier.PUBLIC, Tier.EVENT];
  statusSortList = [
    NftConEditionPurchasableStatus.PURCHASABLE,
    NftConEditionPurchasableStatus.SOLD,
    NftConEditionPurchasableStatus.REDEEMED,
  ];

  @Query(() => VaultListOutput, { defaultValue: [] })
  @Directive("@cacheControl(maxAge:100)")
  async vault_list(
    @Arg("input") { sort, skip = 0, take = 24 }: VaultListInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<VaultListOutput> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any = {
      where: {
        is_active: true,
      },
    };

    switch (sort) {
      case VaultListSort.ALPHABETICAL_ASC:
        args.orderBy = {
          short_name: "asc",
        };
        break;

      case VaultListSort.ALPHABETICAL_DESC:
        args.orderBy = {
          short_name: "desc",
        };
        break;

      default:
        args.orderBy = {
          short_name: "asc",
        };
        break;
    }

    const result = await prismaClient.nft_con_info.findMany(args);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduced: any[] = result.reduce((acc: any, cur: any) => {
      if (!acc.length) {
        acc.push(cur);
        return acc;
      }

      if (acc[acc.length - 1].short_name === cur.short_name) {
        if (acc[acc.length - 1].vintage === "-") {
          return acc;
        }

        if (Number(cur.vintage) > Number(acc[acc.length - 1].vintage)) {
          return acc;
        }

        // TODO: 이름 같을 경우 edition 말고 normal 이미지 사용해야함 (vintage 관계없이)

        const sliced = acc.slice(0, -1);
        acc.push(cur);
        return [...sliced, cur];
      }

      acc.push(cur);
      return acc;
    }, []);

    take = take ?? reduced.length;

    return {
      list: reduced.slice(skip, take + skip),
      totalCount: reduced.length,
    };
  }

  @Query(() => VaultDetailsOutput)
  @Directive("@cacheControl(maxAge:100)")
  async vault_details(
    @Arg("input") { short_name }: VaultDetailsInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<VaultDetailsOutput> {
    const nfts = await prismaClient.nft_con_info.findMany({
      where: {
        short_name,
        is_active: true,
      },
      orderBy: {
        vintage: "asc",
      },
      include: {
        metadata: {
          select: { description: true, attributes: true },
        },
        nft_con_edition: {
          select: {
            price: true,
          },
        },
      },
    });

    const prices = nfts
      .map(({ nft_con_edition }) => {
        const prices = nft_con_edition.map((edition) => edition.price);

        return prices;
      })
      .flat()
      .sort((a, b) => Number(a) - Number(b));

    const details = nfts.reduce((acc, cur, index) => {
      const attributes = cur.metadata?.attributes;
      const metadata = cur.metadata;

      if (!attributes || !attributes.length) {
        return acc;
      }

      const vaultDetail: VaultDetail = {
        grapes: [],
      };

      const detail = attributes.reduce((acc, cur) => {
        if (cur.trait_type === "Vintage") {
          acc.vintage = cur.string_value ?? "";
        }

        if (cur.trait_type === "Country") {
          acc.country = cur.string_value ?? "";
        }

        acc.country_kr =
          acc.country && acc.country in countries ? countries[acc.country] : "";

        if (cur.trait_type === "Region 1") {
          acc.region1 = cur.string_value ?? "";
        }

        if (cur.trait_type === "Region 2") {
          acc.region2 = cur.string_value ?? "";
        }

        if (cur.trait_type === "Winery") {
          acc.winery = cur.string_value ?? "";
        }

        if (cur.trait_type === "Type") {
          acc.type = cur.string_value ?? "";
        }

        acc.type_kr = acc.type && acc.type in types ? types[acc.type] : "";

        if (cur.trait_type === "ABV") {
          acc.abv = cur.string_value ?? "";
        }

        if (cur.display_type === "boost_percentage") {
          const grape = {
            name: cur.trait_type,
            percentage: cur.number_value ?? 0,
          };

          if (!acc.grapes) {
            acc.grapes = [grape];
          } else {
            acc.grapes.push(grape);
          }
        }

        if (cur.trait_type === "Body") {
          acc.body = cur.number_value ?? 0;
        }

        if (cur.trait_type === "Sweetness") {
          acc.sweetness = cur.number_value ?? 0;
        }

        if (cur.trait_type === "Acidity") {
          acc.acidity = cur.number_value ?? 0;
        }

        if (cur.trait_type === "Tannin") {
          acc.tannin = cur.number_value ?? 0;
        }

        if (metadata) {
          acc.description = metadata.description;
        }

        if (cur.trait_type === "Description_kr") {
          acc.description_kr = cur.string_value ?? "";
        }

        return acc;
      }, vaultDetail);

      if (!index) {
        acc.push(detail);
        return acc;
      }

      if (acc[0].vintage === detail.vintage) {
        return acc;
      }

      acc.push(detail);
      return acc;
    }, [] as VaultDetail[]);

    return {
      lowest_price: Number(prices[0]),
      highest_price: Number(prices[prices.length - 1]),
      img_url: nfts[0].img_url as string,
      short_name,
      details,
    };
  }

  @Query(() => VaultRawRelatedEditionsOutput)
  @Directive("@cacheControl(maxAge:100)")
  async vault_raw_related_editions(
    @Arg("input") { short_name }: VaultRawRelatedEditionsInput,
    @Ctx() ctx: IContext
  ): Promise<VaultRawRelatedEditionsOutput> {
    const nfts = await ctx.prismaClient.nft_con_info.findMany({
      where: {
        short_name,
        is_active: true,
      },
      orderBy: {
        vintage: "asc",
      },
      include: {
        nft_con_edition: {
          include: {
            my_nft_con: {
              include: {
                member: true,
              },
            },
          },
        },
      },
    });

    const editions: VaultRelatedEdition[] = [];

    for (const { tier, vintage, capacity, nft_con_edition } of nfts) {
      if (!nft_con_edition || !nft_con_edition.length) {
        continue;
      }

      for await (const edition of nft_con_edition) {
        const { edition_no } = edition;

        const owner_nickname =
          await this.nft_con_edition_field_resolver.owner_nickname(
            edition,
            ctx
          );
        const owner_address =
          await this.nft_con_edition_field_resolver.owner_address(edition, ctx);
        const status =
          await this.nft_con_edition_field_resolver.purchasable_status(
            edition,
            ctx
          );
        const price =
          await this.nft_con_edition_field_resolver.current_exposure_price(
            edition,
            ctx
          );

        const result = {
          nft_con_edition_uuid: edition.uuid,
          tier: tier as Tier,
          vintage,
          capacity: capacity ?? "750ml",
          owner_nickname,
          owner_address,
          status,
          status_kr: NftConEditionPurchasableStatusKr[status],
          edition_no: !Number(edition_no) ? 0 : Number(edition_no),
          price,
        };

        editions.push(result);
      }
    }

    const availableFilter = editions.reduce(
      (acc, cur, index, array) => {
        const { tier, vintage, capacity, status } = cur;

        if (!acc.tier.includes(tier)) acc.tier.push(tier as Tier);
        if (!acc.vintage.includes(vintage)) acc.vintage.push(vintage);
        if (!acc.capacity.includes(capacity)) acc.capacity.push(capacity);
        if (!acc.status.includes(status)) acc.status.push(status);

        if (index === array.length - 1) {
          acc.tier = acc.tier.sort((a, b) => {
            const aTierIndex = this.tierSortList.findIndex(
              (tier) => tier === a
            );
            const bTierIndex = this.tierSortList.findIndex(
              (tier) => tier === b
            );
            return aTierIndex - bTierIndex;
          });

          acc.vintage = acc.vintage.sort((a, b) => {
            if (isNaN(Number(a)) || isNaN(Number(b))) return 0;
            return Number(a) - Number(b);
          });

          acc.capacity = acc.capacity.sort((a, b) => {
            if (!a.includes("ml") || !b.includes("ml")) return 0;
            const aCapacity = Number(a.slice(0, -2));
            const bCapacity = Number(b.slice(0, -2));
            return aCapacity - bCapacity;
          });

          acc.status = acc.status.sort((a, b) => {
            const aStatusIndex = this.statusSortList.findIndex(
              (status) => status === a
            );
            const bStatusIndex = this.statusSortList.findIndex(
              (status) => status === b
            );

            return aStatusIndex - bStatusIndex;
          });
        }

        return acc;
      },
      {
        tier: [],
        vintage: [],
        capacity: [],
        status: [],
      } as VaultRelatedEditionsFilter
    );

    // Default Sorting (ASC, Tier - Vintage - Capacity - Edition - Status - Price)

    const sortByTier = editions.sort((a, b) => {
      const aTierIndex = this.tierSortList.findIndex((tier) => tier === a.tier);
      const bTierIndex = this.tierSortList.findIndex((tier) => tier === b.tier);
      return aTierIndex - bTierIndex;
    });

    const sortByVintage = sortByTier.sort((a, b) => {
      if (a.tier === b.tier) {
        if (isNaN(Number(a.vintage)) || isNaN(Number(b.vintage))) return 0;
        return Number(a.vintage) - Number(b.vintage);
      }
      return 0;
    });

    const sortByCapacity = sortByVintage.sort((a, b) => {
      if (a.tier === b.tier && a.vintage === b.vintage) {
        if (!a.capacity.includes("ml") || !b.capacity.includes("ml")) return 0;
        const aCapacity = Number(a.capacity.slice(0, -2));
        const bCapacity = Number(b.capacity.slice(0, -2));
        return aCapacity - bCapacity;
      }

      return 0;
    });

    const sortByEdition = sortByCapacity.sort((a, b) => {
      if (
        a.tier === b.tier &&
        a.vintage === b.vintage &&
        a.capacity === b.capacity
      ) {
        return Number(a.edition_no) - Number(b.edition_no);
      }
      return 0;
    });

    const sortByStatus = sortByEdition.sort((a, b) => {
      if (
        a.tier === b.tier &&
        a.vintage === b.vintage &&
        a.capacity === b.capacity &&
        a.edition_no === b.edition_no
      ) {
        // TODO: 상태 정의 제대로 해야함

        const aStatusIndex = this.statusSortList.findIndex(
          (status) => status === a.status
        );
        const bStatusIndex = this.statusSortList.findIndex(
          (status) => status === b.status
        );
        return aStatusIndex - bStatusIndex;
      }
      return 0;
    });

    const sortByPrice = sortByStatus.sort((a, b) => {
      if (
        a.tier === b.tier &&
        a.vintage === b.vintage &&
        a.capacity === b.capacity &&
        a.edition_no === b.edition_no &&
        a.status === b.status
      ) {
        return a.price - b.price;
      }
      return 0;
    });

    return { availableFilter, editions: sortByPrice };
  }

  @Query(() => [VaultRelatedEdition])
  @Directive("@cacheControl(maxAge:100)")
  async vault_related_editions(
    @Arg("input") { short_name, filter, sort }: VaultRelatedEditionsInput,
    @Ctx() ctx: IContext
  ): Promise<VaultRelatedEdition[]> {
    let { editions } = await this.vault_raw_related_editions(
      { short_name },
      ctx
    );

    // Filtering
    if (filter) {
      const { tier, vintage, capacity, status } = filter;

      editions = editions.reduce((acc, cur) => {
        if (tier.length && !tier.includes(cur.tier)) return acc;
        if (vintage.length && !vintage.includes(cur.vintage)) return acc;
        if (capacity.length && !capacity.includes(cur.capacity)) return acc;

        // TODO : 상태 정의 제대로 해야함
        if (status.length && !status.includes(cur.status)) return acc;

        acc.push(cur);

        return acc;
      }, [] as VaultRelatedEdition[]);
    }

    // Sorting

    switch (sort) {
      case VaultRelatedEditionsSort.TIER_ASC:
      default:
        return editions;

      case VaultRelatedEditionsSort.TIER_DESC:
        return editions.sort((a, b) => {
          const aTierIndex = this.tierSortList.findIndex(
            (tier) => tier === a.tier
          );
          const bTierIndex = this.tierSortList.findIndex(
            (tier) => tier === b.tier
          );
          return bTierIndex - aTierIndex;
        });

      case VaultRelatedEditionsSort.VINTAGE_ASC:
        return editions.sort((a, b) => {
          if (isNaN(Number(a.vintage)) || isNaN(Number(b.vintage))) return 0;

          return Number(a.vintage) - Number(b.vintage);
        });

      case VaultRelatedEditionsSort.VINTAGE_DESC:
        return editions.sort((a, b) => {
          if (isNaN(Number(a.vintage)) || isNaN(Number(b.vintage))) return 0;

          return Number(b.vintage) - Number(a.vintage);
        });

      case VaultRelatedEditionsSort.CAPACITY_ASC:
        return editions.sort((a, b) => {
          if (!a.capacity.includes("ml") || !b.capacity.includes("ml"))
            return 0;

          const aCapacity = Number(a.capacity.slice(0, -2));
          const bCapacity = Number(b.capacity.slice(0, -2));

          return aCapacity - bCapacity;
        });

      case VaultRelatedEditionsSort.CAPACITY_DESC:
        return editions.sort((a, b) => {
          if (!a.capacity.includes("ml") || !b.capacity.includes("ml"))
            return 0;

          const aCapacity = Number(a.capacity.slice(0, -2));
          const bCapacity = Number(b.capacity.slice(0, -2));

          return bCapacity - aCapacity;
        });

      case VaultRelatedEditionsSort.EDITION_ASC:
        return editions.sort(
          (a, b) => Number(a.edition_no) - Number(b.edition_no)
        );

      case VaultRelatedEditionsSort.EDITION_DESC:
        return editions.sort(
          (a, b) => Number(b.edition_no) - Number(a.edition_no)
        );

      case VaultRelatedEditionsSort.STATUS_ASC:
        return editions.sort((a, b) => {
          const aStatusIndex = this.statusSortList.findIndex(
            (status) => status === a.status
          );
          const bStatusIndex = this.statusSortList.findIndex(
            (status) => status === b.status
          );

          return aStatusIndex - bStatusIndex;
        });

      case VaultRelatedEditionsSort.STATUS_DESC:
        return editions.sort((a, b) => {
          const aStatusIndex = this.statusSortList.findIndex(
            (status) => status === a.status
          );
          const bStatusIndex = this.statusSortList.findIndex(
            (status) => status === b.status
          );

          return bStatusIndex - aStatusIndex;
        });

      case VaultRelatedEditionsSort.PRICE_ASC:
        return editions.sort((a, b) => a.price - b.price);

      case VaultRelatedEditionsSort.PRICE_DESC:
        return editions.sort((a, b) => b.price - a.price);
    }
  }
}
