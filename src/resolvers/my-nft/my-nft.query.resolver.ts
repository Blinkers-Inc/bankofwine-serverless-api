import { IContext } from "src/common/interfaces/context";
import { My_nft_con } from "src/prisma";
import { UuidInput } from "src/common/dto/uuid.input";
import { Arg, Ctx, ObjectType, Query } from "type-graphql";

@ObjectType()
export class MyNftResolver {
  @Query(() => [My_nft_con], { defaultValue: [] })
  async myNfts(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con[]> {
    return prismaClient.my_nft_con.findMany({
      where: { uuid },
    });
  }
}
