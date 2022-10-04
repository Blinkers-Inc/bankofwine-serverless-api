import { IContext } from "src/common/interfaces/context";
import { Nft_con_edition } from "src/prisma";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { UuidInput } from "src/common/dto/uuid.input";
import { PaginationInput } from "src/common/dto/pagination.input";
import { Service } from "typedi";

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
    @Arg("input") { skip, take }: PaginationInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Nft_con_edition[]> {
    return prismaClient.nft_con_edition.findMany({
      skip,
      take,
    });
  }
}
