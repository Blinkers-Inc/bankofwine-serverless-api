import { Field, InputType } from "type-graphql";

import { NftConEditionUuidInput } from "src/common/dto/uuid.input";

@InputType("PurchaseAvailableEditionInput")
export default class PurchaseAvailableEditionInput extends NftConEditionUuidInput {
  @Field()
  connected_wallet_address: string;
}
