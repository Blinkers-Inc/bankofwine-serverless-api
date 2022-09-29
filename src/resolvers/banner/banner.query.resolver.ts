import { IContext } from "src/common/interfaces/context";
import { Banner } from "src/prisma";
import { Ctx, ObjectType, Query } from "type-graphql";

@ObjectType()
export class BannerResolver {
  @Query(() => [Banner], { nullable: true })
  async banners(@Ctx() ctx: IContext): Promise<Banner[]> {
    const prismaClient = ctx.prismaClient;
    const banners = await prismaClient.banner.findMany();

    return banners;
  }
}
