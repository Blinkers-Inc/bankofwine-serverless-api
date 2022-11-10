import { Arg, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { defaultValue } from "src/common/constant";
import { CustomError, CustomErrorCode } from "src/common/error";
import { prismaClient } from "src/lib/prisma";
import { Nft_con_metadata } from "src/prisma";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { CreateNftConMetadataInput } from "src/resolvers/databases/nft-con-metadata/dto/create-nft-con-metadata.dto";

@Service()
@Resolver(Nft_con_metadata)
export class NftConMetadataMutationResolver {
  constructor(private nft_con_info_query_resolver: NftConInfoQueryResolver) {}

  @Mutation(() => Nft_con_metadata)
  async create_nft_con_metadata(
    @Arg("input")
    {
      name,
      attributes,
      description,
      external_url,
      nft_con_uuid,
    }: CreateNftConMetadataInput
  ): Promise<Nft_con_metadata> {
    const nftConInfo = await this.nft_con_info_query_resolver.nft_con_info({
      uuid: nft_con_uuid,
    });

    const nftConMetadata = await prismaClient.nft_con_metadata.findUnique({
      where: {
        nft_con_uuid,
      },
    });

    if (nftConMetadata) {
      throw new CustomError("already exist", CustomErrorCode.ALREADY_EXIST);
    }

    const { gif_url, img_url } = nftConInfo;

    const metadataId = uuid();
    const now = new Date();

    const metadataCreateTx = prismaClient.nft_con_metadata.create({
      data: {
        name,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        animation_url: img_url,
        description,
        external_url: external_url ?? defaultValue.externalUrl,
        image: gif_url!,
        nft_con_uuid,
        uuid: metadataId,
      },
    });

    /*
    1. string_value, number_value가 모두 있으면 에러
    2. string_value, number_value가 모두 없으면 에러
    3. display_type === none 일때 number_value가 있으면 에러
    4. display_type !== none 일때 string_value가 있으면 에러
    
     */
    const attributesCreateTx = attributes.map((ele: any) => {
      return prismaClient.nft_con_metadata_attribute.create({
        data: {
          ...ele,
          created_at: now,
          is_active: true,
          is_delete: false,
          updated_at: now,
          nft_con_metadata_uuid: metadataId,
        },
      });
    });

    await prismaClient.$transaction([metadataCreateTx, ...attributesCreateTx]);

    const metadata = await prismaClient.nft_con_metadata.findUnique({
      where: { nft_con_uuid },
    });

    if (!metadata) {
      throw new CustomError("failed to create metadata");
    }

    return metadata;
  }
}
