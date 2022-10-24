import { Field, InputType, registerEnumType } from "type-graphql";

import {
  VaultRawRelatedEditionsInput,
  VaultRelatedEditionsFilter,
} from "src/resolvers/vault/dto/vault-raw-related-editions.dto";

export enum VaultRelatedEditionsSort {
  CAPACITY_ASC = "CAPACITY_ASC",
  CAPACITY_DESC = "CAPACITY_DESC",
  EDITION_ASC = "EDITION_ASC",
  EDITION_DESC = "EDITION_DESC",
  PRICE_ASC = "PRICE_ASC",
  PRICE_DESC = "PRICE_DESC",
  STATUS_ASC = "STATUS_ASC",
  STATUS_DESC = "STATUS_DESC",
  TIER_ASC = "TIER_ASC",
  TIER_DESC = "TIER_DESC",
  VINTAGE_ASC = "VINTAGE_ASC",
  VINTAGE_DESC = "VINTAGE_DESC",
}

registerEnumType(VaultRelatedEditionsSort, {
  name: "VaultRelatedEditionsSort",
});

@InputType("VaultRelatedEditionsInput")
export class VaultRelatedEditionsInput extends VaultRawRelatedEditionsInput {
  @Field(() => VaultRelatedEditionsFilter, { nullable: true })
  filter: VaultRelatedEditionsFilter;

  @Field(() => VaultRelatedEditionsSort, {
    defaultValue: VaultRelatedEditionsSort.TIER_ASC,
  })
  sort: VaultRelatedEditionsSort;
}
