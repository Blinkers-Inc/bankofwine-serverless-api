import { Field, InputType } from "type-graphql";

@InputType("IsApprovedForAllInput")
export class IsApprovedForAllInput {
  @Field()
  owner: string;

  @Field({ nullable: true, defaultValue: process.env.MIGRATOR_ADDRESS })
  operator?: string;

  @Field({ nullable: true, defaultValue: process.env.PRE_NFT_CONTRACT_ADDRESS })
  nft_contract?: string;
}
