import { InputType } from "type-graphql";

import { CancelListInput } from "src/resolvers/databases/my-nft-con/dto/mutation/cancel-list.dto";

@InputType("PurchaseListInput")
export default class PurchaseListInput extends CancelListInput {}
