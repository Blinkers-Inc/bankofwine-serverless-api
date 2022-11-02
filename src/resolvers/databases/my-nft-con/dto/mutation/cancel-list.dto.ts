import { Field, InputType } from "type-graphql";

import { MyNftConUuidInput } from "src/common/dto/uuid.input";

@InputType("CancelListInput")
export class CancelListInput extends MyNftConUuidInput {
  @Field()
  connected_wallet_address: string;
}
