import { Field, InputType, ObjectType } from "type-graphql";

import { CreateTokenMetadataURIInput } from "src/resolvers/migration/dto/create-token-metadata-uri.dto";

@InputType("MigrateInput", { isAbstract: true })
export class MigrateInput extends CreateTokenMetadataURIInput {
  @Field()
  rlp: string;
}

@ObjectType("MigrateOutput")
export class MigrateOutput {
  @Field()
  transactionHash: string;
}
