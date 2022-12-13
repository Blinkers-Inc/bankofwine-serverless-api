import { nft_con_info } from "@prisma/client";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";
import { CreateNftConInfoInput } from "src/resolvers/databases/nft-con-info/dto/create-nft-con-info.dto";

@Service()
export class NftConInfoRepository {
  async create(input: CreateNftConInfoInput): Promise<nft_con_info> {
    const now = new Date();

    const defaultValue = {
      created_at: now,
      updated_at: now,
      is_active: false,
      is_delete: false,
      updater: "",
    };
    const data = { ...input, ...defaultValue };

    return prismaClient.nft_con_info.create({
      data,
    });
  }
}
