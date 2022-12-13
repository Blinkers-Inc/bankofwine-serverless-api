import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { DepositTxInput } from "src/common/dto/uuid.input";
import { prismaClient } from "src/lib/prisma";
import { Deposit_tx } from "src/prisma";
import {
  AdminQueryDepositTxsFilter,
  AdminQueryDepositTxsInput,
  AdminQueryDepositTxsOutput,
  AdminQueryDepositTxsType,
} from "src/resolvers/databases/deposit-tx/dto/query/deposit-txs.dto";

@Service()
@Resolver(Deposit_tx)
export class DepositTxQueryResolver {
  @Query(() => Deposit_tx)
  async deposit_tx(@Arg("input") input: DepositTxInput): Promise<Deposit_tx> {
    return prismaClient.deposit_tx.findUniqueOrThrow({
      where: {
        uuid: input.deposit_tx_uuid,
      },
    });
  }

  @Authorized()
  @Query(() => AdminQueryDepositTxsOutput)
  async admin_query_deposit_txs(
    @Arg("input") input: AdminQueryDepositTxsInput
  ): Promise<AdminQueryDepositTxsOutput> {
    const { take, skip, type, filter } = input;

    // type이 USE_DEPOSIT_COMPLETE인 경우
    if (type === AdminQueryDepositTxsType.USE_DEPOSIT_COMPLETE) {
      const count = await prismaClient.deposit_tx.count({
        orderBy: {
          tx_request_at: "desc",
        },
        where: {
          AND: [
            {
              deposit_tx_ty: "DEPOSIT",
            },
            {
              tx_status: "USE_DEPOSIT_COMPLETE",
            },
          ],
        },
      });

      const list = await prismaClient.deposit_tx.findMany({
        skip,
        take,
        orderBy: {
          tx_request_at: "desc",
        },
        where: {
          AND: [
            {
              deposit_tx_ty: "DEPOSIT",
            },
            {
              tx_status: "USE_DEPOSIT_COMPLETE",
            },
          ],
        },
      });

      return { count, list };
    }

    const filters: any = [
      {
        deposit_tx_ty: type,
      },
      {
        NOT: {
          tx_status: "USE_DEPOSIT_COMPLETE",
        },
      },
    ];

    if (filter) {
      switch (type) {
        case AdminQueryDepositTxsType.DEPOSIT:
          if (filter === AdminQueryDepositTxsFilter.COMPLETE) {
            filters.push({
              tx_status: "DEPOSIT_REQUEST_COMPLETE",
            });
          }

          if (filter === AdminQueryDepositTxsFilter.CANCEL) {
            filters.push({
              tx_status: "DEPOSIT_REQUEST_CANCEL",
            });
          }

          if (filter === AdminQueryDepositTxsFilter.PENDING) {
            filters.push({
              tx_status: "DEPOSIT_REQUEST_PENDING",
            });
          }
          break;

        case AdminQueryDepositTxsType.WITHDRAW:
          if (filter === AdminQueryDepositTxsFilter.COMPLETE) {
            filters.push({
              tx_status: "WITHDRAW_REQUEST_COMPLETE",
            });
          }

          if (filter === AdminQueryDepositTxsFilter.CANCEL) {
            filters.push({
              tx_status: "WITHDRAW_REQUEST_CANCEL",
            });
          }

          if (filter === AdminQueryDepositTxsFilter.PENDING) {
            filters.push({
              tx_status: "WITHDRAW_REQUEST_PENDING",
            });
          }
          break;
      }
    }

    const count = await prismaClient.deposit_tx.count({
      orderBy: {
        tx_request_at: "desc",
      },
      where: {
        AND: filters,
      },
    });

    const list = await prismaClient.deposit_tx.findMany({
      skip,
      take,
      orderBy: {
        tx_request_at: "desc",
      },
      where: {
        AND: filters,
      },
    });

    return { count, list };
  }
}
