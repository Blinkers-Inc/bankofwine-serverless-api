import CaverExtKas from "caver-js-ext-kas";
import { sleep } from "src/helpers/sleep";

export const handler: AWSLambda.Handler = async (event) => {
  const { rlp } = JSON.parse(event.body);

  const { KAS_ACCESS_KEY, KAS_SECRET_ACCESS_KEY, KAS_CHAIN_ID } = process.env;

  console.log("rlp", rlp);
  console.log("KAS_ACCESS_KEY", KAS_ACCESS_KEY);
  console.log("KAS_SECRET_ACCESS_KEY", KAS_SECRET_ACCESS_KEY);
  console.log("KAS_CHAIN_ID", KAS_CHAIN_ID);
  const caver = new CaverExtKas(
    KAS_CHAIN_ID,
    KAS_ACCESS_KEY,
    KAS_SECRET_ACCESS_KEY
  );

  try {
    const { transactionHash } =
      await caver.kas.wallet.requestFDRawTransactionPaidByGlobalFeePayer({
        rlp,
        submit: true,
      });

    let limit = 0;
    let receipt = null;

    while (limit < 10) {
      await sleep(1000);

      limit++;
      receipt = await caver.rpc.klay.getTransactionReceipt(transactionHash);

      if (receipt) {
        return {
          statusCode: 200,
          body: JSON.stringify({ ...receipt, transactionHash }),
        };
      }

      console.log("limit", limit);
      console.log("receipt :>> ", receipt);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ...receipt, transactionHash }),
    };
  } catch (err: any) {
    console.log("err", err);
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          input: event.body,
          message: err.message,
          detail: err,
        },
        null,
        2
      ),
    };
  }
};
