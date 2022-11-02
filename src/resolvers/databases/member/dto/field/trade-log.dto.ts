import { Field, ObjectType } from "type-graphql";

import { MarketTradeStatus } from "src/prisma";

@ObjectType("TradeLog")
export class TradeLog {
  @Field()
  uuid: string;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Number)
  price: number;

  @Field(() => MarketTradeStatus, { name: "status" })
  status: MarketTradeStatus;

  @Field()
  nft_con_edition_uuid: string;
}

@ObjectType("TradeLogOutput")
export class TradeLogOutput {
  @Field(() => Number)
  total_purchase_price: number;

  @Field(() => Number)
  total_sell_price: number;

  @Field(() => [TradeLog])
  list: TradeLog[];
}
