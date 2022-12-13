import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { CustomError } from "src/common/error";
import { Nft_con_editionCreateManyInput } from "src/prisma";
import { CreateNftConEditionsInput } from "src/resolvers/databases/nft-con-edition/dto/mutation/create-nft-con-editions.dto";
import { NftConEditionRepository } from "src/resolvers/databases/nft-con-edition/nft-con-edition.repository";
@Service()
export class NftConEditionMutationService {
  constructor(private nftConEditionRepository: NftConEditionRepository) {}

  async createNftConEditions(input: CreateNftConEditionsInput) {
    const { count, nft_con_uuid, minting_at, price, creator } = input;

    const now = new Date();

    const highestEditionNoHasEdition =
      await this.nftConEditionRepository.findFirstWhereEditionNoIsHighest(
        nft_con_uuid
      );

    const highestEditionNo = !highestEditionNoHasEdition
      ? 0
      : Number(highestEditionNoHasEdition.edition_no);
    const initEditionNo = highestEditionNo + 1; // 가장 높은 edition_no가 있을 경우 +1, 없으면 1

    // count 수 만큼 배치 배열 생성
    const data: Nft_con_editionCreateManyInput[] = Array.from(
      { length: count },
      (_value, index) => {
        const edition_no: number = initEditionNo + index;

        return {
          uuid: uuid(),
          created_at: now,
          is_active: false, // 비활성화로 시작
          is_delete: false,
          updated_at: now,
          creator,
          updater: "",
          edition_no: BigInt(edition_no),
          minting_at,
          status: "AVAILABLE",
          price: BigInt(price),
          redeem_status: "NONE",
          sort: BigInt(edition_no),
          nft_con_uuid,
        };
      }
    );

    try {
      const { count: batchCount } =
        await this.nftConEditionRepository.createMany(data);

      if (count !== batchCount) {
        throw new CustomError("배치 작업 수량이 일치하지 않습니다.");
      }

      return batchCount;
    } catch {
      throw new CustomError("에디션 데이터 저장 중 문제 발생했습니다.");
    }
  }
}
