import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { MemberUidInput } from "src/common/dto/uuid.input";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { Deposit } from "src/prisma";

@Service()
@Resolver(Deposit)
export class DepositQueryResolver {
  @Query(() => Deposit)
  async deposit(
    @Arg("input") input: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<Deposit> {
    const { member_uid } = input;
    const deposits = await prismaClient.deposit.findMany({
      where: {
        member_uid,
      },
    });

    if (!deposits.length) {
      throw new CustomError("invalid uid", CustomErrorCode.INVALID_UID, input);
    }

    return deposits[0];
  }
}
