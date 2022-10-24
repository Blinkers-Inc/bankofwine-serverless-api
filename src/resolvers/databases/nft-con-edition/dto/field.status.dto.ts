import { registerEnumType } from "type-graphql";

export enum NftConEditionStatus {
  PURCHASABLE = "PURCHASABLE",
  REDEEMED = "REDEEMED",
  SOLD = "SOLD",
}

registerEnumType(NftConEditionStatus, {
  name: "NftConEditionStatus",
});
