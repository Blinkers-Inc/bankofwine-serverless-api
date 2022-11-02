import { Field, InputType, Int } from "type-graphql";

import { MyNftConUuidInput } from "src/common/dto/uuid.input";

@InputType("CreateListInput")
export class CreateListInput extends MyNftConUuidInput {
  @Field()
  connected_wallet_address: string;

  @Field(() => Int)
  sub_total: number;

  @Field(() => Int)
  commission: number;

  @Field(() => Int)
  total: number;
}
