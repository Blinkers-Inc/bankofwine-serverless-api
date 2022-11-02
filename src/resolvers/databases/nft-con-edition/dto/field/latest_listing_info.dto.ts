import { Field, InputType, ObjectType } from "type-graphql";

@InputType("LatestListingInfoInput")
export class LatestListingInfoInput {
  @Field({ nullable: true })
  token_id?: string;

  @Field({ defaultValue: process.env.PRE_NFT_CONTRACT_ADDRESS })
  contract_address?: string;
}

@ObjectType("LatestListingInfoOutput")
export class LatestListingInfoOutput {
  @Field(() => Number)
  sub_total: number;

  @Field(() => Number)
  commission: number;

  @Field(() => Number)
  total: number;

  @Field(() => Date)
  listing_at: Date;

  @Field(() => Boolean)
  is_listing: boolean;

  @Field(() => Boolean)
  is_purchasable: boolean;
}
