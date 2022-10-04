import { CreateTokenMetadataURIInput } from "src/resolvers/migration/dto/createTokenMetadataURI";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

@InputType()
export class MigrateInput extends CreateTokenMetadataURIInput {
  @Field()
  rlp: string;
}

@ObjectType()
export class MigrateOutput {
  @Field()
  transactionHash: string;
}
