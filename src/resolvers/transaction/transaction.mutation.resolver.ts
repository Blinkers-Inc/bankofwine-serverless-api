import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { sleep } from "src/helpers/sleep";
import {
  SendRawTransactionInput,
  SendRawTransactionOutput,
  TransactionStatus,
} from "src/resolvers/transaction/dto/send-raw-transaction.dto";

@Service()
@Resolver()
export class TransactionMutationResolver {
  @Mutation(() => SendRawTransactionOutput)
  async send_raw_transaction(
    @Arg("input") { rlp }: SendRawTransactionInput,
    @Ctx() { caver }: IContext
  ): Promise<SendRawTransactionOutput> {
    let transactionHash = "";

    // const decoded = caver.transaction.decode(rlp); // 추후 검증시 필요

    try {
      ({ transactionHash } =
        await caver.kas.wallet.requestFDRawTransactionPaidByGlobalFeePayer({
          rlp,
          submit: true,
        }));
    } catch (err: any) {
      throw new CustomError(err.message, CustomErrorCode.TRANSACTION_FAILED, {
        rlp,
      });
    }

    let limit = 0;
    let receipt = null;

    while (limit < 5) {
      await sleep(1000);

      limit++;
      receipt = await caver.rpc.klay.getTransactionReceipt(transactionHash);

      if (receipt) {
        const { status: transactionStatus } = receipt;
        const status =
          transactionStatus === "0x1"
            ? TransactionStatus.SUCCESS
            : TransactionStatus.FAILURE;

        return {
          status,
          transactionHash,
        };
      }
    }

    return { status: TransactionStatus.UNCERTAIN, transactionHash };
  }
}
