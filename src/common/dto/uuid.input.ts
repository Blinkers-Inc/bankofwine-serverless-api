import { Field, InputType } from "type-graphql";

@InputType("UuidInput")
export class UuidInput {
  @Field()
  uuid!: string;
}

@InputType("DepositInput")
export class DepositInput {
  @Field()
  deposit_uuid!: string;
}

@InputType("DepositTxInput")
export class DepositTxInput {
  @Field()
  deposit_tx_uuid!: string;
}

@InputType("MemberUidInput")
export class MemberUidInput {
  @Field()
  member_uid!: string;
}

@InputType("MyNftConUuidInput")
export class MyNftConUuidInput {
  @Field()
  my_nft_con_uuid!: string;
}

@InputType("NftConUuidInput")
export class NftConUuidInput {
  @Field()
  nft_con_uuid!: string;
}

@InputType("NftConEditionUuidInput")
export class NftConEditionUuidInput {
  @Field()
  nft_con_edition_uuid!: string;
}
