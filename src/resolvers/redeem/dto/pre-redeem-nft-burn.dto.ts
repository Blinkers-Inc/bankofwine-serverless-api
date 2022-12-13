import { Field, InputType } from "type-graphql";

import { SendRawTransactionInput } from "src/resolvers/transaction/dto/send-raw-transaction.dto";

@InputType("PreRedeemNftBurnInput")
export class PreRedeemNftBurnInput extends SendRawTransactionInput {
  @Field()
  my_nft_con_uuid: string;
}
