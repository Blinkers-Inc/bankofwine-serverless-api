import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Nft_con_edition, Nft_con_info } from "src/prisma";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";

@Service()
@Resolver(Nft_con_edition)
export class NftConEditionFieldResolver {
  constructor(private nft_con_info_query_resolver: NftConInfoQueryResolver) {}

  @FieldResolver(() => Nft_con_info)
  async nft_con_info(
    @Root() { nft_con_uuid }: Nft_con_edition,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_info> {
    return await this.nft_con_info_query_resolver.nft_con_info(
      { uuid: nft_con_uuid },
      ctx
    );
  }
}
