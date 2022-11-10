import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IContext {
  @Field(() => JSON, { name: "caver" })
  caver: any;

  @Field({ defaultValue: "", name: "Authorization" })
  Authorization: string;
}
