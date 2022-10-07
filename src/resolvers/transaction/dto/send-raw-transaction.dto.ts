import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

export enum TransactionStatus {
  FAILURE = "FAILURE",
  SUCCESS = "SUCCESS",
  UNCERTAIN = "UNCERTAIN",
}

registerEnumType(TransactionStatus, {
  name: "TransactionStatus",
});

@InputType("SendRawTransactionInput", { isAbstract: true })
export class SendRawTransactionInput {
  @Field()
  rlp: string;
}

@ObjectType("SendRawTransactionOutput")
export class SendRawTransactionOutput {
  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field()
  transactionHash: string;
}
