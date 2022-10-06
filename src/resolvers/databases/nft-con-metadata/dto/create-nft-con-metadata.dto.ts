import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from "type-graphql";

export enum MetadataDisplayType {
  DATE = "date",
  RANKING = "ranking",
  NUMBER = "number",
  STRING = "string",
  BOOST_PERCENTAGE = "boost_percentage",
}

registerEnumType(MetadataDisplayType, {
  name: "MetadataDisplayType",
});

@InputType("MetadataAttributeInput", { isAbstract: true })
export class MetadataAttributeInput {
  @Field(() => Boolean)
  is_public: boolean;

  @Field()
  trait_type: string;

  @Field(() => MetadataDisplayType, { defaultValue: MetadataDisplayType.NONE })
  display_type?: MetadataDisplayType;

  @Field({ nullable: true })
  string_value?: string;

  @Field(() => Float, { nullable: true })
  number_value?: number;

  @Field(() => Float, { nullable: true })
  max_value?: number;
}

@InputType("CreateNftConMetadataInput")
export class CreateNftConMetadataInput {
  @Field()
  nft_con_uuid: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [MetadataAttributeInput])
  attributes: MetadataAttributeInput[];

  @Field({ defaultValue: "#cc3333", nullable: true })
  background_color?: string;

  @Field({ defaultValue: "https://www.bankofwine.co/", nullable: true })
  external_url?: string;
}

@ObjectType("CreateNftConMetadataOutput")
export class CreateNftConMetadataOutput {
  @Field()
  tokenURI: string;
}
