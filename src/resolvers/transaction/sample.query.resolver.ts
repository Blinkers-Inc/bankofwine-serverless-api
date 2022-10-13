import { Authorized, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

@Service()
@Resolver()
export class SampleResolver {
  @Authorized()
  @Query(() => String, { nullable: true })
  async hello(): Promise<string> {
    return "hello world";
  }
}
