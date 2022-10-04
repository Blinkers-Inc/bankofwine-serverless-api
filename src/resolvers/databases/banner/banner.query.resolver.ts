import { IContext } from "src/common/interfaces/context";
import { Banner } from "src/prisma";
import { Ctx, Resolver, Query } from "type-graphql";

@Resolver(Banner)
export class BannerQueryResolver {
  @Query(() => [Banner], { defaultValue: [] })
  async banners(@Ctx() { prismaClient }: IContext): Promise<Banner[]> {
    return prismaClient.banner.findMany();
  }
}
