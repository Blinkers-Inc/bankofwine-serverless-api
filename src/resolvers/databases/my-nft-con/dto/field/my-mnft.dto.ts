import { Field, InputType } from "type-graphql";

@InputType("MyMnftOfMyNftConInput")
export class MyMnftOfMyNftConInput {
  @Field({ nullable: true })
  current_owner_uid?: string;
}
