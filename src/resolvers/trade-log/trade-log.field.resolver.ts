import { FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";
import { Nft_con_edition } from "src/prisma";
import { TradeLog } from "src/resolvers/databases/member/dto/field/trade-log.dto";

@Service()
@Resolver(TradeLog)
export class TradeLogFieldResolver {
  @FieldResolver(() => Nft_con_edition)
  async nft_con_edition(
    @Root() { nft_con_edition_uuid }: TradeLog
  ): Promise<Nft_con_edition> {
    return prismaClient.nft_con_edition.findUniqueOrThrow({
      where: { uuid: nft_con_edition_uuid },
    });
  }
}
