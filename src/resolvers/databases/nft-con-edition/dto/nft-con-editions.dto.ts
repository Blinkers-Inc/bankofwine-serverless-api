import { Field, InputType } from "type-graphql";

import { PaginationInput } from "src/common/dto/pagination.input";

@InputType("NftConEditionsInput", { isAbstract: true })
export class NftConEditionsInput extends PaginationInput {
  @Field()
  nft_con_uuid: string;
}
