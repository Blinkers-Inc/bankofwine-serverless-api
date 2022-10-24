import { Field, InputType, Int } from "type-graphql";

@InputType("PaginationInput")
export class PaginationInput {
  @Field(() => Int, { defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { defaultValue: 10_000 })
  take?: number;
}
