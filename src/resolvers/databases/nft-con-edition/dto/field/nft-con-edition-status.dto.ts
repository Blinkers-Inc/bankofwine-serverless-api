import { registerEnumType } from "type-graphql";

export enum NftConEditionPurchasableStatus {
  PURCHASABLE = "PURCHASABLE",
  REDEEMED = "REDEEMED",
  SOLD = "SOLD",
}

registerEnumType(NftConEditionPurchasableStatus, {
  name: "NftConEditionPurchasableStatus",
});
