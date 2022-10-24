import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Nft_con_edition, Nft_con_info, Nft_con_metadata } from "src/prisma";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";

@Service()
@Resolver(Nft_con_info)
export class NftConInfoFieldResolver {
  constructor(
    private nft_con_metadata_query_resolver: NftConMetadataQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver
  ) {}

  @FieldResolver(() => Nft_con_metadata, { nullable: true })
  async metadata(
    @Root() { uuid: nft_con_uuid }: Nft_con_info,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_metadata | null> {
    return this.nft_con_metadata_query_resolver.nft_con_metadata(
      {
        nft_con_uuid,
      },
      ctx
    );
  }

  @FieldResolver(() => [Nft_con_edition], { defaultValue: [] })
  async editions(
    @Root() { uuid: nft_con_uuid }: Nft_con_info,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_edition[]> {
    return this.nft_con_edition_query_resolver.nft_con_editions(
      {
        nft_con_uuid,
      },
      ctx
    );
  }
}
