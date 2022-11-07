import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { PaginationInput } from "src/common/dto/pagination.input";
import { NftConUuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_metadata } from "src/prisma";

@Service()
@Resolver(Nft_con_metadata)
export class NftConMetadataQueryResolver {
  @Query(() => Nft_con_metadata)
  async nft_con_metadata(
    @Arg("input") { nft_con_uuid }: NftConUuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_metadata> {
    return prismaClient.nft_con_metadata.findUniqueOrThrow({
      where: { nft_con_uuid },
    });
  }

  @Query(() => [Nft_con_metadata], { defaultValue: [] })
  async nft_con_metadatas(
    @Arg("input") { skip, take }: PaginationInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_metadata[]> {
    return prismaClient.nft_con_metadata.findMany({
      where: { is_active: true },
      skip,
      take,
    });
  }
}
