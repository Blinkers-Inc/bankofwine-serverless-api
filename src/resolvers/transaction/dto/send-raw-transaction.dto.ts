import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  UNCERTAIN = "UNCERTAIN",
}

registerEnumType(TransactionStatus, {
  name: "TransactionStatus",
});

@InputType("SendRawTransactionInput")
export class SendRawTransactionInput {
  @Field()
  rlp!: string;
}

@ObjectType("SendRawTransactionOutput")
export class SendRawTransactionOutput {
  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field()
  transactionHash: string;
}
