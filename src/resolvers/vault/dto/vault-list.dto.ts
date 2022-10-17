import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from "type-graphql";

import { PaginationInput } from "src/common/dto/pagination.input";
import { Nft_con_info } from "src/prisma";

export enum VaultListSort {
  ALPHABETICAL_ASC = "alphabetical_asc",
  ALPHABETICAL_DESC = "alphabetical_desc",
  HIGH_PRICE = "high_price",
  LOW_PRICE = "low_price",
}

registerEnumType(VaultListSort, {
  name: "VaultListSort",
});

@InputType("VaultListInput")
export class VaultListInput extends PaginationInput {
  @Field(() => Int, { defaultValue: 24 })
  take?: number;

  @Field(() => VaultListSort, {
    nullable: true,
    defaultValue: VaultListSort.ALPHABETICAL_ASC,
  })
  sort?: VaultListSort;
}

@ObjectType("VaultListOutput")
export class VaultListOutput {
  @Field(() => [Nft_con_info], { defaultValue: [] })
  list: Nft_con_info[];

  @Field(() => Int)
  totalCount: number;
}
