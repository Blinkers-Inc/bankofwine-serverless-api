import { nft_con_info } from "@prisma/client";
import { Service } from "typedi";

import { CreateNftConInfoInput } from "src/resolvers/databases/nft-con-info/dto/create-nft-con-info.dto";
import { NftConInfoRepository } from "src/resolvers/databases/nft-con-info/nft-con-info.repository";

@Service()
export class NftConInfoMutationService {
  constructor(private nftConInfoRepository: NftConInfoRepository) {}

  async createNftConInfo(input: CreateNftConInfoInput): Promise<nft_con_info> {
    const now = new Date();

    const defaultValue = {
      created_at: now,
      updated_at: now,
      is_active: false, // default 로 비활성화
      is_delete: false,
      updater: "",
      sort: BigInt(0), // 사용하지 않을 예정
    };

    const data = { ...input, ...defaultValue };

    return await this.nftConInfoRepository.create(data);
  }
}
