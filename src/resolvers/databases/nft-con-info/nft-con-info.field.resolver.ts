import { FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { getVaultDetailByAttributes } from "src/helpers/get-detail-by-attributes";
import { prismaClient } from "src/lib/prisma";
import { Nft_con_edition, Nft_con_info, Nft_con_metadata } from "src/prisma";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";
import { VaultDetail } from "src/resolvers/vault/dto/vault-details.dto";

@Service()
@Resolver(Nft_con_info)
export class NftConInfoFieldResolver {
  constructor(
    private nft_con_metadata_query_resolver: NftConMetadataQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver
  ) {}

  @FieldResolver(() => Nft_con_metadata, { nullable: true })
  async metadata(
    @Root() { uuid: nft_con_uuid }: Nft_con_info
  ): Promise<Nft_con_metadata | null> {
    return this.nft_con_metadata_query_resolver.nft_con_metadata({
      nft_con_uuid,
    });
  }

  @FieldResolver(() => [Nft_con_edition], { defaultValue: [] })
  async editions(
    @Root() { uuid: nft_con_uuid }: Nft_con_info
  ): Promise<Nft_con_edition[]> {
    return this.nft_con_edition_query_resolver.nft_con_editions({
      nft_con_uuid,
    });
  }

  @FieldResolver(() => VaultDetail)
  async vault_detail(@Root() { uuid }: Nft_con_info): Promise<VaultDetail> {
    const nftConWithVaultDetail =
      await prismaClient.nft_con_info.findUniqueOrThrow({
        where: {
          uuid,
        },
        include: {
          metadata: {
            include: {
              attributes: true,
            },
          },
        },
      });

    const attributes = nftConWithVaultDetail.metadata?.attributes;
    const metadata = nftConWithVaultDetail.metadata;
    const initVaultDetail: VaultDetail = {
      grapes: [],
    };

    if (!attributes || !attributes.length) {
      return initVaultDetail;
    }

    const vaultDetail = getVaultDetailByAttributes({
      metadata: metadata as Nft_con_metadata,
      attributes,
    });

    return vaultDetail;
  }
}
