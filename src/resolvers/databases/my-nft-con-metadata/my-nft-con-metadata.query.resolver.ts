import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { PaginationInput } from "src/common/dto/pagination.input";
import { MyNftConUuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { My_nft_con_metadata } from "src/prisma";

@Service()
@Resolver(My_nft_con_metadata)
export class MyNftConMetadataQueryResolver {
  @Query(() => My_nft_con_metadata)
  async my_nft_con_metadata(
    @Arg("input") { my_nft_con_uuid }: MyNftConUuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con_metadata> {
    return prismaClient.my_nft_con_metadata.findUniqueOrThrow({
      where: { my_nft_con_uuid },
    });
  }

  @Query(() => [My_nft_con_metadata], { defaultValue: [] })
  async my_nft_con_metadatas(
    @Arg("input") { skip, take }: PaginationInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con_metadata[]> {
    return prismaClient.my_nft_con_metadata.findMany({
      skip,
      take,
    });
  }
}
