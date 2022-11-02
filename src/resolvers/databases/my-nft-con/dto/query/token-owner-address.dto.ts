import { Field, InputType } from "type-graphql";

@InputType("TokenOwnerAddressInput")
export class TokenOwnerAddressInput {
  @Field({ nullable: true })
  token_id?: string;

  @Field({ defaultValue: process.env.PRE_NFT_CONTRACT_ADDRESS })
  contract_address?: string;
}
