import { Arg, Authorized, Directive, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { DepositTxInput } from "src/common/dto/uuid.input";
import { CustomError, CustomErrorCode } from "src/common/error";
import { prismaClient } from "src/lib/prisma";
import { Deposit_tx } from "src/prisma";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";
import { DepositTxQueryResolver } from "src/resolvers/databases/deposit-tx/deposit-tx.query.resolver";

@Service()
@Resolver(Deposit_tx)
export class DepositTxMutationResolver {
  constructor(
    private deposit_query_resolver: DepositQueryResolver,
    private deposit_tx_query_resolver: DepositTxQueryResolver
  ) {}

  @Authorized()
  @Mutation(() => Deposit_tx, {
    description: `'예치금 입금 신청' 승인 -> 총 보유 예치금: ⬆️, 사용 가능 예치금: ⬆️, 입금 대기 예치금: ⬇️\n어드민, 미사용`,
  })
  @Directive("@cacheControl(maxAge:0)")
  async admin_mutation_complete_deposit(
    @Arg("input")
    input: DepositTxInput
  ): Promise<Deposit_tx> {
    const { deposit_tx_uuid } = input;

    const depositTx = await this.deposit_tx_query_resolver.deposit_tx({
      deposit_tx_uuid,
    });

    if (depositTx.tx_status !== "DEPOSIT_REQUEST_PENDING") {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    }

    const deposit = await this.deposit_query_resolver.deposit({
      deposit_uuid: depositTx.deposit_uuid,
    });

    const depositRequestAmount = depositTx.deposit_req_amnt ?? BigInt(0);
    const now = new Date();

    const depositUpdateTransaction = prismaClient.deposit.update({
      where: {
        uuid: depositTx.deposit_uuid,
      },
      data: {
        avail_deposit_sum: deposit.avail_deposit_sum + depositRequestAmount,
        deposit_sum: deposit.deposit_sum + depositRequestAmount,
        pending_deposit_sum: deposit.pending_deposit_sum - depositRequestAmount,
        updated_at: now,
      },
    });

    const depositTxUpdateTransaction = prismaClient.deposit_tx.update({
      where: {
        uuid: deposit_tx_uuid,
      },
      data: {
        tx_status: "DEPOSIT_REQUEST_COMPLETE",
        tx_approve_at: now,
        updated_at: now,
      },
    });

    await prismaClient.$transaction([
      depositUpdateTransaction,
      depositTxUpdateTransaction,
    ]);

    return prismaClient.deposit_tx.findUniqueOrThrow({
      where: { uuid: deposit_tx_uuid },
    });
  }

  @Authorized()
  @Mutation(() => Deposit_tx, {
    description: `'예치금 출금 신청' 승인 -> 총 보유 예치금: ⬇️, 사용 가능 예치금: −, 출금 대기 예치금: ⬇️\n어드민, 미사용`,
  })
  @Directive("@cacheControl(maxAge:0)")
  async admin_mutation_complete_withdraw(
    @Arg("input")
    input: DepositTxInput
  ): Promise<Deposit_tx> {
    const { deposit_tx_uuid } = input;

    const depositTx = await this.deposit_tx_query_resolver.deposit_tx({
      deposit_tx_uuid,
    });

    if (depositTx.tx_status !== "WITHDRAW_REQUEST_PENDING") {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    }

    const deposit = await this.deposit_query_resolver.deposit({
      deposit_uuid: depositTx.deposit_uuid,
    });

    const withdrawRequestAmount = depositTx.deposit_req_amnt ?? BigInt(0);

    if (
      deposit.deposit_sum < withdrawRequestAmount ||
      deposit.pending_withdraw_sum < withdrawRequestAmount
    ) {
      throw new CustomError(
        "invalid price",
        CustomErrorCode.INVALID_PRICE,
        input
      );
    }

    const now = new Date();

    const depositUpdateTransaction = prismaClient.deposit.update({
      where: {
        uuid: depositTx.deposit_uuid,
      },
      data: {
        deposit_sum: deposit.deposit_sum - withdrawRequestAmount,
        pending_withdraw_sum:
          deposit.pending_withdraw_sum - withdrawRequestAmount,
        updated_at: now,
      },
    });

    const depositTxUpdateTransaction = prismaClient.deposit_tx.update({
      where: {
        uuid: deposit_tx_uuid,
      },
      data: {
        tx_status: "WITHDRAW_REQUEST_COMPLETE",
        tx_approve_at: now,
        updated_at: now,
      },
    });

    await prismaClient.$transaction([
      depositUpdateTransaction,
      depositTxUpdateTransaction,
    ]);

    return prismaClient.deposit_tx.findUniqueOrThrow({
      where: { uuid: deposit_tx_uuid },
    });
  }

  @Authorized()
  @Mutation(() => Deposit_tx, {
    description: `'예치금 출금 신청' 취소 -> 총 보유 예치금: -, 사용 가능 예치금: ⬆️, 출금 대기 예치금: ⬇️\n어드민, 미사용`,
  })
  @Directive("@cacheControl(maxAge:0)")
  async admin_mutation_cancel_withdraw(
    @Arg("input")
    input: DepositTxInput
  ): Promise<Deposit_tx> {
    const { deposit_tx_uuid } = input;

    const depositTx = await this.deposit_tx_query_resolver.deposit_tx({
      deposit_tx_uuid,
    });

    if (depositTx.tx_status !== "WITHDRAW_REQUEST_PENDING") {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    }

    const deposit = await this.deposit_query_resolver.deposit({
      deposit_uuid: depositTx.deposit_uuid,
    });

    const withdrawRequestAmount = depositTx.deposit_req_amnt ?? BigInt(0);
    const now = new Date();

    const depositUpdateTransaction = prismaClient.deposit.update({
      where: {
        uuid: depositTx.deposit_uuid,
      },
      data: {
        avail_deposit_sum: deposit.avail_deposit_sum + withdrawRequestAmount,
        pending_withdraw_sum:
          deposit.pending_withdraw_sum - withdrawRequestAmount,
        updated_at: now,
      },
    });

    const depositTxUpdateTransaction = prismaClient.deposit_tx.update({
      where: {
        uuid: deposit_tx_uuid,
      },
      data: {
        tx_status: "WITHDRAW_REQUEST_CANCEL",
        updated_at: now,
      },
    });

    await prismaClient.$transaction([
      depositUpdateTransaction,
      depositTxUpdateTransaction,
    ]);

    return prismaClient.deposit_tx.findUniqueOrThrow({
      where: { uuid: deposit_tx_uuid },
    });
  }
}
