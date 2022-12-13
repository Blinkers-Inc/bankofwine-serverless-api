import { Field, InputType, Int, ObjectType } from "type-graphql";
import { registerEnumType } from "type-graphql";

import { PaginationInput } from "src/common/dto/pagination.input";
import { Deposit_tx } from "src/prisma";

export enum AdminQueryDepositTxsType {
  DEPOSIT = "DEPOSIT",
  USE_DEPOSIT_COMPLETE = "USE_DEPOSIT_COMPLETE",
  WITHDRAW = "WITHDRAW",
}

registerEnumType(AdminQueryDepositTxsType, {
  name: "AdminQueryDepositTxsType",
});

export enum AdminQueryDepositTxsFilter {
  CANCEL = "CANCEL",
  COMPLETE = "COMPLETE",
  PENDING = "PENDING",
}

registerEnumType(AdminQueryDepositTxsFilter, {
  name: "AdminQueryDepositTxsFilter",
});

@InputType("AdminQueryDepositTxsInput")
export class AdminQueryDepositTxsInput extends PaginationInput {
  @Field(() => AdminQueryDepositTxsType)
  type: AdminQueryDepositTxsType;

  @Field(() => AdminQueryDepositTxsFilter, { nullable: true })
  filter?: AdminQueryDepositTxsFilter;
}

@ObjectType("AdminQueryDepositTxsOutput")
export class AdminQueryDepositTxsOutput {
  @Field(() => Int)
  count: number;

  @Field(() => [Deposit_tx])
  list: Deposit_tx[];
}
