import { Field, InputType } from "type-graphql";

@InputType("CreateRedeemInput")
export class CreateRedeemInput {
  @Field()
  my_nft_con_uuid: string;

  @Field()
  location_cd: string;

  @Field(() => Date)
  redeem_dt: Date;

  @Field(() => Boolean)
  plcy_agreed: boolean;
}
