import { Arg, Query, Resolver } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { DepositInput, MemberUidInput } from "src/common/dto/uuid.input";
import { prismaClient } from "src/lib/prisma";
import { Deposit } from "src/prisma";

@Service()
@Resolver(Deposit)
export class DepositQueryResolver {
  @Query(() => Deposit, { name: "deposit", description: "어드민, 미사용" })
  async deposit(@Arg("input") input: DepositInput): Promise<Deposit> {
    return prismaClient.deposit.findUniqueOrThrow({
      where: {
        uuid: input.deposit_uuid,
      },
    });
  }

  @Query(() => Deposit, { name: "member_deposit" })
  async member_deposit(@Arg("input") input: MemberUidInput): Promise<Deposit> {
    const { member_uid } = input;
    const deposit = await prismaClient.deposit.findFirst({
      orderBy: {
        updated_at: "desc",
      },
      where: {
        is_active: true,
        member_uid,
      },
    });

    if (!deposit) {
      const newDepositUuid = uuid();
      const now = new Date();
      const zeroBigInt = BigInt(0);

      await prismaClient.deposit.create({
        data: {
          uuid: newDepositUuid,
          created_at: now,
          is_active: true,
          is_delete: false,
          updated_at: now,
          avail_deposit_sum: zeroBigInt,
          deposit_sum: zeroBigInt,
          pending_deposit_sum: zeroBigInt,
          pending_withdraw_sum: zeroBigInt,
          member_uid,
        },
      });

      return prismaClient.deposit.findUniqueOrThrow({
        where: { uuid: newDepositUuid },
      });
    }

    return deposit;
  }
}
