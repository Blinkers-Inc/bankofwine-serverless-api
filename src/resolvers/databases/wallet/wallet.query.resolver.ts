import { Arg, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput, UuidInput } from "src/common/dto/uuid.input";
import { prismaClient } from "src/lib/prisma";
import { Wallet } from "src/prisma";

@Service()
@Resolver(Wallet)
export class WalletQueryResolver {
  @Query(() => Wallet)
  async wallet(@Arg("input") { uuid }: UuidInput): Promise<Wallet> {
    return prismaClient.wallet.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [String])
  async used_wallet_addresses(
    @Arg("input") { member_uid }: MemberUidInput
  ): Promise<string[]> {
    const usedWallets = await prismaClient.wallet.findMany({
      take: 10000,
      where: { member_uid },
      select: {
        address: true,
      },
    });
    return [...new Set(usedWallets.map((wallet) => wallet.address))];
  }

  @Query(() => Wallet, { nullable: true })
  async latest_wallet(
    @Arg("input") { member_uid }: MemberUidInput
  ): Promise<Wallet | null> {
    return prismaClient.wallet.findFirst({
      where: { member_uid },
      orderBy: { updated_at: "desc" },
    });
  }
}
