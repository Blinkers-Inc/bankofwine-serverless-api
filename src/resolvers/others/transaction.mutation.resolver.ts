import { sleep } from "src/helpers/sleep";
import { IContext } from "src/common/interfaces/context";
import {
  ReceiveTransactionInput,
  ReceiveTransactionOutput,
  TransactionStatus,
} from "src/resolvers/others/dto/receive-transaction.dto";

import { Ctx, Arg, Mutation, ObjectType } from "type-graphql";

@ObjectType()
export class TransactionMutationResolver {
  @Mutation(() => ReceiveTransactionOutput)
  async receiveTransaction(
    @Arg("input") { rlp }: ReceiveTransactionInput,
    @Ctx() { caver }: IContext
  ): Promise<ReceiveTransactionOutput> {
    let transactionHash = "";

    try {
      ({ transactionHash } =
        await caver.kas.wallet.requestFDRawTransactionPaidByGlobalFeePayer({
          rlp,
          submit: true,
        }));
    } catch (err: any) {
      throw new Error(err.message);
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

        return { status, transactionHash };
      }
    }

    return { status: TransactionStatus.UNCERTAIN, transactionHash };
  }
}
