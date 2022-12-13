import { nft_con_info } from "@prisma/client";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";
import { Nft_con_infoCreateInput } from "src/prisma";

@Service()
export class NftConInfoRepository {
  async create(data: Nft_con_infoCreateInput): Promise<nft_con_info> {
    return prismaClient.nft_con_info.create({
      data,
    });
  }
}
