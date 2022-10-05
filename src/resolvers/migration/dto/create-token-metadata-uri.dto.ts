import { Field, InputType, ObjectType } from "type-graphql";

@InputType("CreateTokenMetadataURIInput", { isAbstract: true })
export class CreateTokenMetadataURIInput {
  @Field()
  tokenId: string;

  @Field()
  tokenUuid: string;

  @Field()
  senderAddress: string;

  @Field(() => Boolean)
  is_mnft: boolean;
}

@ObjectType("CreateTokenMetadataURIOutput")
export class CreateTokenMetadataURIOutput {
  @Field()
  tokenURI: string;
}
