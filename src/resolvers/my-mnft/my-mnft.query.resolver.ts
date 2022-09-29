import { IContext } from "src/common/interfaces/context";
import { My_mnft } from "src/prisma";
import { UuidInput } from "src/common/dto/uuid.input";
import { Arg, Ctx, ObjectType, Query } from "type-graphql";

@ObjectType()
export class MyMnftResolver {
  @Query(() => [My_mnft], { defaultValue: [] })
  async myMnfts(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_mnft[]> {
    return prismaClient.my_mnft.findMany({
      where: { uuid },
    });
  }
}
