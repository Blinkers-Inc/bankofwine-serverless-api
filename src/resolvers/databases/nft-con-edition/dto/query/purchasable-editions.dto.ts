import { Field, InputType, Int, ObjectType } from "type-graphql";

import { PaginationInput } from "src/common/dto/pagination.input";
import { RecentMintingEdition } from "src/resolvers/databases/nft-con-edition/dto/query/recent-minting-editions.dto";

@InputType("PurchasableEditionsInput")
export class PurchasableEditionsInput extends PaginationInput {
  @Field(() => Int, { defaultValue: 12 })
  take?: number;
}

@ObjectType("PurchasableEdition")
export class PurchasableEdition extends RecentMintingEdition {
  @Field()
  nft_con_edition_uuid: string;

  @Field(() => Number)
  edition_no: number;
}

@ObjectType("PurchasableEditionsOutput")
export class PurchasableEditionsOutput {
  @Field(() => [PurchasableEdition])
  editions: PurchasableEdition[];

  @Field(() => Number)
  total_count: number;
}
