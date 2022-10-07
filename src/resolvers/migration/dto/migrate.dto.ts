import { Field, InputType, ObjectType } from "type-graphql";

import { SendRawTransactionInput } from "src/resolvers/transaction/dto/send-raw-transaction.dto";

@InputType("MigrateInput")
export class MigrateInput extends SendRawTransactionInput {
  @Field()
  my_nft_uuid: string;

  @Field(() => Boolean)
  is_mnft: boolean;
}

@ObjectType("MigrateOutput")
export class MigrateOutput {
  @Field()
  transactionHash: string;

  @Field()
  token_id: string;

  @Field()
  token_uri: string;
}
