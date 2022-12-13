import { Field, InputType, Int, ObjectType } from "type-graphql";

import { timestamps } from "src/common/constant";
import { PaginationInput } from "src/common/dto/pagination.input";
import { Nft_con_edition } from "src/prisma";
import { VaultDetail } from "src/resolvers/vault/dto/vault-details.dto";
import { Tier } from "src/resolvers/vault/dto/vault-raw-related-editions.dto";

@InputType("RecentMintingEditionsInput")
export class RecentMintingEditionsInput extends PaginationInput {
  @Field(() => Int, { defaultValue: 12 })
  take?: number;

  @Field(() => Number, {
    defaultValue: new Date().valueOf() + timestamps.ONE_WEEK_MILLISECONDS,
  })
  to_timestamp?: number;
}

@ObjectType("RecentMintingEdition")
export class RecentMintingEdition extends VaultDetail {
  @Field()
  nft_con_uuid: string;

  @Field(() => Date)
  minting_at: Date;

  @Field()
  img_url: string;

  @Field()
  static_diagonal_img_url: string;

  @Field()
  rate_of_price_fluctuation: string;

  @Field()
  short_name: string;

  @Field(() => Tier)
  tier: Tier;

  @Field(() => Number, { defaultValue: 0 })
  minting_price?: number;

  @Field(() => Number, { defaultValue: 0 })
  purchasable_amount?: number;

  @Field(() => [Nft_con_edition], { defaultValue: [] })
  purchasable_editions?: Nft_con_edition[];
}
