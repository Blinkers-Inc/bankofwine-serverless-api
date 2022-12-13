import { Field, InputType, Int } from "type-graphql";

@InputType("CreateNftConEditionsInput")
export class CreateNftConEditionsInput {
  @Field(() => Int, { description: "에디션 생성 수" })
  count: number;

  @Field()
  nft_con_uuid: string;

  @Field(() => Date, { description: "민팅 예정일" })
  minting_at: Date;

  @Field(() => Int)
  price: number;

  @Field()
  creator: string;
}
