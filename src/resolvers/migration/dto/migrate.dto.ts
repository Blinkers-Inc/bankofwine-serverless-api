import { Field, InputType, ObjectType } from "type-graphql";

@InputType("MigrateInput", { isAbstract: true })
export class MigrateInput {
  @Field()
  rlp: string;
}

@ObjectType("MigrateOutput")
export class MigrateOutput {
  @Field()
  transactionHash: string;
}
