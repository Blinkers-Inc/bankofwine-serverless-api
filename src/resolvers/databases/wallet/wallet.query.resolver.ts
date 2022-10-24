import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput, UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { Wallet } from "src/prisma";

@Service()
@Resolver(Wallet)
export class WalletQueryResolver {
  @Query(() => Wallet)
  async wallet(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Wallet> {
    return prismaClient.wallet.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => Wallet, { nullable: true })
  async latest_wallet(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Wallet | null> {
    return prismaClient.wallet.findFirst({
      where: { member_uid },
      orderBy: { updated_at: "desc" },
    });
  }

  @Query(() => [Wallet], { defaultValue: [] })
  async wallets(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Wallet[]> {
    return prismaClient.wallet.findMany({ where: { member_uid } });
  }
}
