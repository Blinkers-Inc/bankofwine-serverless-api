import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { uuid } from "uuidv4";

import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { Nft_con_metadata } from "src/prisma";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { CreateNftConMetadataInput } from "src/resolvers/databases/nft-con-metadata/dto/create-nft-con-metadata.dto";

@Service()
@Resolver(Nft_con_metadata)
export class NftConMetadataMutationResolver {
  constructor(private nft_con_info_query_resolver: NftConInfoQueryResolver) {}

  @Mutation(() => String)
  async create_nft_con_metadata(
    @Arg("input")
    {
      name,
      attributes,
      description,
      external_url,
      nft_con_uuid,
    }: CreateNftConMetadataInput,
    @Ctx() ctx: IContext
  ): Promise<string> {
    const nftConInfo = await this.nft_con_info_query_resolver.nft_con_info(
      {
        uuid: nft_con_uuid,
      },
      ctx
    );

    const nftConMetadata = await ctx.prismaClient.nft_con_metadata.findUnique({
      where: {
        nft_con_uuid,
      },
    });

    if (nftConMetadata) {
      throw new CustomError("already exist", CustomErrorCode.ALREADY_EXIST);
    }

    const { gif_url, img_url } = nftConInfo;

    const metadataId = uuid();

    const metadataCreateTx = ctx.prismaClient.nft_con_metadata.create({
      data: {
        name,
        animation_url: img_url,
        description,
        external_url: external_url!,
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
      return ctx.prismaClient.nft_con_metadata_attribute.create({
        data: {
          ...ele,
          nft_con_metadata_uuid: metadataId,
          uuid: uuid(),
        },
      });
    });

    const batchTransactions = await ctx.prismaClient.$transaction([
      metadataCreateTx,
      ...attributesCreateTx,
    ]);

    console.log("batchTransactions", batchTransactions);

    // await ctx.prismaClient.nft_con_metadata.createMany;
    return "hello";
  }
}
