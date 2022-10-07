import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { IContext } from "src/common/interfaces/context";
import { IsApprovedForAllInput } from "src/resolvers/migration/dto/is-approved-for-all.dto";

@Service()
@Resolver()
export class MigrationQueryResolver {
  @Query(() => Boolean)
  async is_approved_for_all(
    @Arg("input") { owner, operator }: IsApprovedForAllInput,
    @Ctx() { caver }: IContext
  ): Promise<boolean> {
    const instance = new caver.klay.Contract(
      ERC721_ABI,
      process.env.CONTRACT_ADDRESS
    );

    return instance.methods.isApprovedForAll(owner, operator).call();
  }
}
