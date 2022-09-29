import { Authorized, ObjectType, Query } from "type-graphql";

@ObjectType()
export class SampleResolver {
  @Authorized()
  @Query(() => String, { nullable: true })
  async hello(): Promise<string> {
    return "hello world";
  }
}
