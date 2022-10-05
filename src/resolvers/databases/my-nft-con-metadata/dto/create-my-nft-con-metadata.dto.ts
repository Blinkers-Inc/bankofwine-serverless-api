import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from "type-graphql";

export enum MetadataDisplayType {
  DATE = "date",
  RANKING = "ranking",
  NUMBER = "number",
  NONE = "none",
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

  @Field(() => MetadataDisplayType)
  display_type: MetadataDisplayType;

  @Field({ nullable: true })
  string_value?: string;

  @Field(() => Float, { nullable: true })
  number_value?: number;

  @Field(() => Float, { nullable: true })
  max_value?: number;
}

@InputType("CreateMyNftConMetadataInput")
export class CreateMyNftConMetadataInput {
  @Field()
  my_nft_con_uuid: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  image: string;

  @Field()
  animation_url: string;

  @Field(() => Boolean)
  is_mnft: boolean;

  @Field(() => [MetadataAttributeInput])
  attributes: MetadataAttributeInput[];

  @Field(() => Int)
  attributesLength: number;

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
