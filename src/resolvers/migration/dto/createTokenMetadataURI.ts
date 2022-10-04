import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

@InputType()
export class CreateTokenMetadataURIInput {
  @Field()
  tokenId: string;

  @Field()
  tokenUuid: string;

  @Field()
  senderAddress: string;

  @Field(() => Boolean)
  isMNFT: boolean;
}

@ObjectType()
export class CreateTokenMetadataURIOutput {
  @Field()
  tokenURI: string;
}
