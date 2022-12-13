import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IContext {
  @Field(() => JSON, { name: "caver" })
  caver: any;

  @Field({ defaultValue: "", name: "Authorization" })
  Authorization: string;

  @Field({
    defaultValue: "false",
    name: "isAdmin",
    description: "어드민 여부",
  })
  isAdmin: string;
}
