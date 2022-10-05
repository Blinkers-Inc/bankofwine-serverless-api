import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { uuid } from "uuidv4";

import { CustomError } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { My_nft_con_metadata } from "src/prisma";
import { CreateMyNftConMetadataInput } from "src/resolvers/databases/my-nft-con-metadata/dto/create-my-nft-con-metadata.dto";

@Service()
@Resolver(My_nft_con_metadata)
export class MyNftConMetadataMutationResolver {
  @Mutation(() => String)
  async create_my_nft_con_metadata(
    @Arg("input")
    {
      name,
      animation_url,
      attributes,
      attributesLength,
      description,
      external_url,
      image,
      is_mnft,
      my_nft_con_uuid,
    }: CreateMyNftConMetadataInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<string> {
    if (attributes.length !== attributesLength) throw new CustomError("hello");

    //todo: my_nft_con_uuid 로 데이터가 이미 있으면 에러

    console.log("my_nft_con_uuid", my_nft_con_uuid);
    console.log("name", name);
    console.log("description", description);
    console.log("image", image);
    console.log("external_url", external_url);
    console.log("is_mnft", is_mnft);
    console.log("animation_url", animation_url);
    console.log("attributes", attributes);

    const metadataId = uuid();

    const metadataCreateTx = prismaClient.my_nft_con_metadata.create({
      data: {
        name,
        animation_url,
        description,
        external_url: external_url!,
        image,
        my_nft_con_uuid,
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
      return prismaClient.my_nft_con_metadata_attribute.create({
        data: {
          ...ele,
          my_nft_con_metadata_uuid: metadataId,
          uuid: uuid(),
        },
      });
    });

    const batchTransactions = await prismaClient.$transaction([
      metadataCreateTx,
      ...attributesCreateTx,
    ]);

    console.log("batchTransactions", batchTransactions);

    // await prismaClient.nft_con_metadata.createMany;
    return "hello";
  }
}
