import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { Nft_con_info } from "src/prisma";
import { CreateNftConInfoInput } from "src/resolvers/databases/nft-con-info/dto/create-nft-con-info.dto";
import { NftConInfoMutationService } from "src/resolvers/databases/nft-con-info/services/nft-con-info.mutation.service";

@Service()
@Resolver(Nft_con_info)
export class NftConInfoMutationResolver {
  constructor(private nftConInfoMutationService: NftConInfoMutationService) {}

  @Authorized()
  @Mutation(() => Nft_con_info, {
    description: "nft_con_info 생성 (admin only)",
  })
  async create_nft_con_info(
    @Arg("input") input: CreateNftConInfoInput
  ): Promise<Nft_con_info> {
    return await this.nftConInfoMutationService.createNftConInfo(input);
  }
}
