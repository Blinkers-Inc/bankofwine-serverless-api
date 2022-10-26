import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from "type-graphql";

import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { VaultDetailsInput } from "src/resolvers/vault/dto/vault-details.dto";

export enum Tier {
  EVENT = "EVENT",
  OG = "OG",
  PUBLIC = "PUBLIC",
  SPCL = "SPCL",
}

registerEnumType(Tier, {
  name: "Tier",
});

@InputType("VaultRawRelatedEditionsInput")
export class VaultRawRelatedEditionsInput extends VaultDetailsInput {}

@ObjectType("Grape")
export class Grape {
  @Field()
  name: string;

  @Field(() => Float)
  percentage: number;
}

@ObjectType("VaultRelatedEdition")
export class VaultRelatedEdition {
  @Field()
  nft_con_edition_uuid: string;

  @Field(() => Tier)
  tier: Tier;

  @Field()
  vintage: string;

  @Field()
  capacity: string;

  @Field(() => Int)
  edition_no: number;

  @Field(() => Int)
  price: number;

  @Field()
  owner_nickname: string;

  @Field()
  owner_address: string;

  @Field(() => NftConEditionPurchasableStatus)
  status: NftConEditionPurchasableStatus;

  @Field()
  status_kr: string;
}

@ObjectType("VaultRawRelatedEditionsFilterOutput")
@InputType("VaultRelatedEditionsFilter")
export class VaultRelatedEditionsFilter {
  @Field(() => [Tier], { defaultValue: [] })
  tier: Tier[];

  @Field(() => [String], { defaultValue: [] })
  vintage: string[];

  @Field(() => [String], { defaultValue: [] })
  capacity: string[];

  @Field(() => [String], { defaultValue: [] })
  status: string[];
}

@ObjectType("VaultRawRelatedEditionsOutput")
export class VaultRawRelatedEditionsOutput {
  @Field(() => VaultRelatedEditionsFilter)
  availableFilter: VaultRelatedEditionsFilter;

  @Field(() => [VaultRelatedEdition])
  editions: VaultRelatedEdition[];
}
