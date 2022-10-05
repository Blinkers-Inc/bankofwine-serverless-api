import { Field, InputType, Int } from "type-graphql";

import { MetadataAttributeInput } from "src/resolvers/databases/my-nft-con-metadata/dto/create-my-nft-con-metadata.dto";

@InputType("CreateMyMnftMetadataInput")
export class CreateMyMnftMetadataInput {
  @Field()
  my_mnft_uuid: string;

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
