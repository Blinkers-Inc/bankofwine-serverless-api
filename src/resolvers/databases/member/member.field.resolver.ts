import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Member, Wallet } from "src/prisma";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";

@Service()
@Resolver(Member)
export class MemberFieldResolver {
  constructor(private wallet_query_resolver: WalletQueryResolver) {}

  @FieldResolver(() => [Wallet])
  async wallets(
    @Root() { uid: member_uid }: Member,
    @Ctx() ctx: IContext
  ): Promise<Wallet[]> {
    return this.wallet_query_resolver.wallets({ member_uid }, ctx);
  }
}
