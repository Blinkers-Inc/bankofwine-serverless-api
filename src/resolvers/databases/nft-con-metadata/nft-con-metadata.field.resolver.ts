import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Nft_con_metadata, Nft_con_metadata_attribute } from "src/prisma";

@Service()
@Resolver(Nft_con_metadata)
export class NftConMetadataFieldResolver {
  @FieldResolver(() => [Nft_con_metadata_attribute])
  async attributes(
    @Root() { uuid: nft_con_metadata_uuid }: Nft_con_metadata,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_metadata_attribute[]> {
    return prismaClient.nft_con_metadata_attribute.findMany({
      where: { nft_con_metadata_uuid },
    });
  }
}
