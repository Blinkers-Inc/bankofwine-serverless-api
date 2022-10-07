import { Field, Int, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IMetadataAttribute {
  @Field()
  display_type: string;

  @Field()
  trait_type: string;

  @Field()
  value: number | string;

  @Field(() => Int, { nullable: true })
  max_value?: number;
}
