import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { IContext } from "src/common/interfaces/context";
import { IsApprovedForAllInput } from "src/resolvers/migration/dto/is-approved-for-all.dto";

@Service()
@Resolver()
export class MigrationQueryResolver {
  @Query(() => Boolean)
  @Directive("@cacheControl(maxAge:0)")
  async is_approved_for_all(
    @Arg("input") { owner, operator, nft_contract }: IsApprovedForAllInput,
    @Ctx() { caver }: IContext
  ): Promise<boolean> {
    const instance = new caver.klay.Contract(ERC721_ABI, nft_contract);

    return instance.methods.isApprovedForAll(owner, operator).call();
  }
}
