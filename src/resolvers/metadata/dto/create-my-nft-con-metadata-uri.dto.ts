import { Field, InputType, ObjectType } from "type-graphql";
import { registerEnumType } from "type-graphql";

export enum MnftType {
  BOTTLE = "BOTTLE",
  GLASS = "GLASS",
}

registerEnumType(MnftType, {
  name: "MnftType",
});

@InputType("CreateMyNftConMetadataURIInput")
export class CreateMyNftConMetadataURIInput {
  @Field()
  my_nft_con_uuid: string;

  @Field()
  token_id: string;

  @Field({ nullable: true })
  nft_con_edition_uuid?: string;
}

@InputType("CreateMyMnftMetadataURIInput")
export class CreateMyMnftMetadataURIInput {
  @Field()
  my_mnft_uuid: string;

  @Field()
  token_id: string;
}

@ObjectType("CreateMetadataURIOutput")
export class CreateMetadataURIOutput {
  @Field()
  token_uri: string;
}
