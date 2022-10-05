import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { PaginationInput } from "src/common/dto/pagination.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_info } from "src/prisma";

@Service()
@Resolver(Nft_con_info)
export class NftConInfoQueryResolver {
  @Query(() => Nft_con_info)
  async nft_con_info(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_info> {
    return prismaClient.nft_con_info.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [Nft_con_info], { defaultValue: [] })
  async nft_con_infos(
    @Arg("input") { skip, take }: PaginationInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_info[]> {
    return prismaClient.nft_con_info.findMany({
      skip,
      take,
    });
  }
}
