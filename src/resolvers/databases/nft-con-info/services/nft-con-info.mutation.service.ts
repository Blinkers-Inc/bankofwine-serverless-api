import { nft_con_info } from "@prisma/client";
import { Service } from "typedi";

import { CreateNftConInfoInput } from "src/resolvers/databases/nft-con-info/dto/create-nft-con-info.dto";
import { NftConInfoRepository } from "src/resolvers/databases/nft-con-info/nft-con-info.repository";

@Service()
export class NftConInfoMutationService {
  constructor(private nftConInfoRepository: NftConInfoRepository) {}

  async createNftConInfo(input: CreateNftConInfoInput): Promise<nft_con_info> {
    return await this.nftConInfoRepository.create(input);
  }
}
