import { Field, InputType } from "type-graphql";

@InputType("MyMnftOfMyNftConInput")
export class MyMnftOfMyNftConInput {
  @Field({ nullable: true })
  member_uid?: string;
}
