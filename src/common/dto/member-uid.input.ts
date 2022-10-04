import { Field, InputType } from "type-graphql";

@InputType()
export class MemberUidInput {
  @Field()
  member_uid!: string;
}
