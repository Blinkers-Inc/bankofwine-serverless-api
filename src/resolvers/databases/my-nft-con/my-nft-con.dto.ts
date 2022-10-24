import { registerEnumType } from "type-graphql";

export enum MyNftConStatus {
  MNFT_APPLIED = "MNFT_APPLIED",
  PAID = "PAID",
  PENDING = "PENDING",
  REDEEM_COMPLETE = "REDEEM_COMPLETE",
  REDEEM_PENDING = "REDEEM_PENDING",
}

registerEnumType(MyNftConStatus, {
  name: "MyNftConStatus",
});
