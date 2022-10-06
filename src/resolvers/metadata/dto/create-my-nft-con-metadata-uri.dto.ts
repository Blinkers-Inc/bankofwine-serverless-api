import { Field, InputType, ObjectType } from "type-graphql";

@InputType("CreateMyNftConMetadataURIInput")
export class CreateMyNftConMetadataURIInput {
  @Field()
  my_nft_con_uuid: string;

  @Field()
  tokenId: string;
}

@ObjectType("CreateMyNftConMetadataURIOutput")
export class CreateMyNftConMetadataURIOutput {
  @Field()
  tokenURI: string;
}
