import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_edition } from "src/prisma";
import { NftConEditionsInput } from "src/resolvers/databases/nft-con-edition/dto/nft-con-editions.dto";

@Service()
@Resolver(Nft_con_edition)
export class NftConEditionQueryResolver {
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
}
