import { PutObjectRequest } from "aws-sdk/clients/s3";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { s3 } from "src/common/aws";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { IMetadataAttribute } from "src/common/interfaces/metadata-attribute";
import { Nft_con_metadata_attribute } from "src/prisma";
import { MyMnftFieldResolver } from "src/resolvers/databases/my-mnft/my-mnft.field.resolver";
import { MyMnftQueryResolver } from "src/resolvers/databases/my-mnft/my-mnft.query.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { MetadataDisplayType } from "src/resolvers/databases/nft-con-metadata/dto/create-nft-con-metadata.dto";
import { NftConMetadataFieldResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.field.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";
import {
  CreateMetadataURIOutput,
  CreateMyMnftMetadataURIInput,
  CreateMyNftConMetadataURIInput,
  MnftType,
} from "src/resolvers/metadata/dto/create-my-nft-con-metadata-uri.dto";

@Service()
@Resolver()
export class MetadataMutationResolver {
  constructor(
    private my_nft_con_query_resolver: MyNftConQueryResolver,
    private my_mnft_query_resolver: MyMnftQueryResolver,
    private my_mnft_field_resolver: MyMnftFieldResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver,
    private nft_con_info_query_resolver: NftConInfoQueryResolver,
    private nft_con_metadata_query_resolver: NftConMetadataQueryResolver,
    private nft_con_metadata_field_resolver: NftConMetadataFieldResolver
  ) {}

  @Mutation(() => CreateMetadataURIOutput)
  async create_my_nft_con_metadata_uri(
    @Arg("input")
    {
      my_nft_con_uuid,
      token_id,
      nft_con_edition_uuid,
    }: CreateMyNftConMetadataURIInput,
    @Ctx() ctx: IContext
  ): Promise<CreateMetadataURIOutput> {
    let nftConEditionUuid: string;

    if (nft_con_edition_uuid) {
      nftConEditionUuid = nft_con_edition_uuid;
    } else {
      const { nft_con_edition_uuid: editionUuid } =
        await this.my_nft_con_query_resolver.my_nft_con(
          {
            uuid: my_nft_con_uuid,
          },
          ctx
        );

      nftConEditionUuid = editionUuid;
    }

    const { edition_no, nft_con_uuid } =
      await this.nft_con_edition_query_resolver.nft_con_edition(
        {
          uuid: nftConEditionUuid,
        },
        ctx
      );

    const { tier } = await this.nft_con_info_query_resolver.nft_con_info(
      { uuid: nft_con_uuid },
      ctx
    );

    const nftConMetadata =
      await this.nft_con_metadata_query_resolver.nft_con_metadata(
        {
          nft_con_uuid,
        },
        ctx
      );

    const attributes = await this.nft_con_metadata_field_resolver.attributes(
      nftConMetadata,
      ctx
    );

    const {
      nft_con_uuid: _,
      uuid: __,
      created_at: ___,
      updated_at: ____,
      is_active: _____,
      is_delete: ______,
      ...rest
    } = nftConMetadata;

    const reducedAttributes = attributes
      .filter((ele: Nft_con_metadata_attribute) => ele.is_public === true)
      .map((ele: Nft_con_metadata_attribute): IMetadataAttribute => {
        let value: string | number;

        if (ele.display_type === MetadataDisplayType.STRING) {
          value = ele.string_value!;
        } else {
          value = ele.number_value!;
        }

        return ele.max_value
          ? {
              display_type: ele.display_type,
              max_value: ele.max_value,
              trait_type: ele.trait_type,
              value,
            }
          : {
              display_type: ele.display_type,
              trait_type: ele.trait_type,
              value,
            };
      });

    const tierAttribute = {
      display_type: MetadataDisplayType.STRING,
      trait_type: "Tier",
      value: tier,
    };

    const editionAttribute = {
      display_type: MetadataDisplayType.NUMBER,
      trait_type: "Edition",
      value: Number(edition_no),
    };

    const completedAttributes = [
      tierAttribute,
      editionAttribute,
      ...reducedAttributes,
    ];
    const metadata = { ...rest, attributes: completedAttributes };
    const uploadParams: PutObjectRequest = {
      ACL: "public-read",
      Body: JSON.stringify(metadata),
      Bucket: process.env.NFT_METADATA_BUCKET_NAME!,
      Key: token_id + ".json",
    };

    const { Location: token_uri } = await s3.upload(uploadParams).promise();

    return {
      token_uri,
    };
  }

  @Mutation(() => CreateMetadataURIOutput)
  async create_my_mnft_metadata_uri(
    @Arg("input")
    { my_mnft_uuid, token_id }: CreateMyMnftMetadataURIInput,
    @Ctx() ctx: IContext
  ): Promise<CreateMetadataURIOutput> {
    const myMnft = await this.my_mnft_query_resolver.my_mnft(
      {
        uuid: my_mnft_uuid,
      },
      ctx
    );

    const { mynft_uuid, tasted_at, type, image_url, gif_url } = myMnft;

    if (!type) {
      throw new CustomError("empty type", CustomErrorCode.EMPTY_TYPE);
    }

    const { nft_con_edition_uuid } =
      await this.my_nft_con_query_resolver.my_nft_con(
        {
          uuid: mynft_uuid,
        },
        ctx
      );

    const { edition_no, nft_con_uuid } =
      await this.nft_con_edition_query_resolver.nft_con_edition(
        {
          uuid: nft_con_edition_uuid,
        },
        ctx
      );

    const { tier } = await this.nft_con_info_query_resolver.nft_con_info(
      { uuid: nft_con_uuid },
      ctx
    );

    const nftConMetadata =
      await this.nft_con_metadata_query_resolver.nft_con_metadata(
        {
          nft_con_uuid,
        },
        ctx
      );

    const attributes = await this.nft_con_metadata_field_resolver.attributes(
      nftConMetadata,
      ctx
    );

    const {
      nft_con_uuid: _,
      uuid: __,
      created_at: ___,
      updated_at: ____,
      is_active: _____,
      is_delete: ______,
      ...rest
    } = nftConMetadata;

    const reducedAttributes = attributes
      .filter((ele: Nft_con_metadata_attribute) => ele.is_public === true)
      .map((ele: Nft_con_metadata_attribute): IMetadataAttribute => {
        let value: string | number;

        if (ele.display_type === MetadataDisplayType.STRING) {
          value = ele.string_value!;
        } else {
          value = ele.number_value!;
        }

        return ele.max_value
          ? {
              display_type: ele.display_type,
              max_value: ele.max_value,
              trait_type: ele.trait_type,
              value,
            }
          : {
              display_type: ele.display_type,
              trait_type: ele.trait_type,
              value,
            };
      });

    const tierAttribute = {
      display_type: MetadataDisplayType.STRING,
      trait_type: "Tier",
      value: tier,
    };

    const editionAttribute = {
      display_type: MetadataDisplayType.NUMBER,
      trait_type: "Edition",
      value: Number(edition_no),
    };

    const tastingDayAttribute = {
      display_type: MetadataDisplayType.DATE,
      trait_type: "Tasting Day",
      value: Math.floor(Date.parse(tasted_at.toString()) / 1000),
    };

    const participants = await this.my_mnft_field_resolver.participants(
      myMnft,
      ctx
    );

    const mnftEditionAttribute = {
      display_type: MetadataDisplayType.NUMBER,
      trait_type: "M-NFT Edition",
      value:
        type === MnftType.BOTTLE
          ? 1
          : !participants.length
          ? 1
          : Number(participants[0].edition_no),
    };

    const completedAttributes = [
      tierAttribute,
      editionAttribute,
      ...reducedAttributes,
      tastingDayAttribute,
      mnftEditionAttribute,
    ];

    const name =
      type === MnftType.GLASS ? `Glass_${rest.name}` : `Bottle_${rest.name}`;

    const metadata = {
      ...rest,
      name,
      animation_url: image_url,
      image: gif_url,
      attributes: completedAttributes,
    };
    const uploadParams: PutObjectRequest = {
      ACL: "public-read",
      Body: JSON.stringify(metadata),
      Bucket: process.env.M_NFT_METADATA_BUCKET_NAME!,
      Key: token_id + ".json",
    };

    const { Location: token_uri } = await s3.upload(uploadParams).promise();

    return {
      token_uri,
    };
  }
}
