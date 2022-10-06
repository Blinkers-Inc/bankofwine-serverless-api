import { PutObjectRequest } from "aws-sdk/clients/s3";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { s3 } from "src/common/aws";
import { IContext } from "src/common/interfaces/context";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { MetadataDisplayType } from "src/resolvers/databases/nft-con-metadata/dto/create-nft-con-metadata.dto";
import { NftConMetadataFieldResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.field.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";
import {
  CreateMyNftConMetadataURIInput,
  CreateMyNftConMetadataURIOutput,
} from "src/resolvers/metadata/dto/create-my-nft-con-metadata-uri.dto";

@Service()
@Resolver()
export class MetadataMutationResolver {
  constructor(
    private my_nft_con_query_resolver: MyNftConQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver,
    private nft_con_info_query_resolver: NftConInfoQueryResolver,
    private nft_con_metadata_query_resolver: NftConMetadataQueryResolver,
    private nft_con_metadata_field_resolver: NftConMetadataFieldResolver
  ) {}

  @Mutation(() => CreateMyNftConMetadataURIOutput)
  async create_my_nft_con_metadata_uri(
    @Arg("input") { my_nft_con_uuid, tokenId }: CreateMyNftConMetadataURIInput,
    @Ctx() ctx: IContext
  ): Promise<CreateMyNftConMetadataURIOutput> {
    //- 1. my_nft_con_uuid 를 통해 연결된 메타데이터를 호출.

    const { nft_con_edition_uuid } =
      await this.my_nft_con_query_resolver.my_nft_con(
        {
          uuid: my_nft_con_uuid,
        },
        ctx
      );

    const { edition_no, nft_con_uuid } =
      await this.nft_con_edition_query_resolver.nft_con_edition(
        {
          uuid: nft_con_edition_uuid!,
        },
        ctx
      );

    await this.nft_con_info_query_resolver.nft_con_info(
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

    const { nft_con_uuid: _, uuid: __, ...rest } = nftConMetadata;

    const reducedAttributes = attributes
      .filter((ele: any) => ele.is_public === true)
      .map((ele: any) => {
        delete ele.uuid;
        delete ele.nft_con_metadata_uuid;
        delete ele.is_public;

        if (ele.display_type === MetadataDisplayType.STRING) {
          ele.value = ele.string_value;
        } else {
          ele.value = ele.number_value;
        }

        if (!ele.max_value) {
          delete ele.max_value;
        }

        delete ele.string_value;
        delete ele.number_value;

        return ele;
      });

    const editionAttribute = {
      display_type: MetadataDisplayType.NUMBER,
      display_value: "Big",
      trait_type: "Edition",
      value: Number(edition_no),
    };

    const completedAttributes = [editionAttribute, ...reducedAttributes];
    const metadata = { ...rest, attributes: completedAttributes };

    const uploadParams: PutObjectRequest = {
      ACL: "public-read",
      Body: JSON.stringify(metadata),
      Bucket: process.env.BUCKET_NAME!,
      Key: tokenId + ".json",
    };

    const { Location } = await s3.upload(uploadParams).promise();

    return {
      tokenURI: Location,
    };
  }
}
