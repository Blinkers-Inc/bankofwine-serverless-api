import { Field, InputType, Int } from "type-graphql";

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  take?: number;
}
