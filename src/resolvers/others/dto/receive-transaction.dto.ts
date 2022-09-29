import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  UNCERTAIN = "UNCERTAIN",
}

registerEnumType(TransactionStatus, {
  name: "TransactionStatus",
});

@InputType()
export class ReceiveTransactionInput {
  @Field()
  rlp!: string;
}

@ObjectType()
export class ReceiveTransactionOutput {
  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field()
  transactionHash: string;
}
