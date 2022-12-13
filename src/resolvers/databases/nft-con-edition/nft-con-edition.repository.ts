import { nft_con_edition } from "@prisma/client";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";
import { Nft_con_editionCreateManyInput } from "src/prisma";

@Service()
export class NftConEditionRepository {
  async findFirstWhereEditionNoIsHighest(
    nftConUuid: string
  ): Promise<nft_con_edition | null> {
    return await prismaClient.nft_con_edition.findFirst({
      where: {
        nft_con_uuid: nftConUuid,
      },
      orderBy: {
        edition_no: "desc",
      },
    });
  }

  async createMany(data: Nft_con_editionCreateManyInput[]) {
    return prismaClient.nft_con_edition.createMany({
      data,
      skipDuplicates: false,
    });
  }
}
