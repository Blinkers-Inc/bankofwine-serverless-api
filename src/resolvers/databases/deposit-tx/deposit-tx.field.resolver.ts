import { FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { Deposit, Deposit_tx } from "src/prisma";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";

@Service()
@Resolver(Deposit_tx)
export class DepositTxFieldResolver {
  constructor(private deposit_query_resolver: DepositQueryResolver) {}

  @FieldResolver(() => Deposit, {
    name: "deposit",
    description: "어드민, 미사용",
  })
  async deposit(@Root() { deposit_uuid }: Deposit_tx): Promise<Deposit> {
    return this.deposit_query_resolver.deposit({ deposit_uuid });
  }
}
