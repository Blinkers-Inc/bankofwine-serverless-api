import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import { IContext } from "src/common/interfaces/context";
import {
  CreateTokenMetadataURIInput,
  CreateTokenMetadataURIOutput,
} from "src/resolvers/migration/dto/create-token-metadata-uri.dto";
import {
  MigrateInput,
  MigrateOutput,
} from "src/resolvers/migration/dto/migrate.dto";

@Resolver()
export class MigrationMutationResolver {
  @Mutation(() => CreateTokenMetadataURIOutput)
  async create_token_metadata_uri(
    @Arg("input") input: CreateTokenMetadataURIInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<CreateTokenMetadataURIOutput> {
    const { is_mnft, senderAddress, tokenId, tokenUuid } = input;
    await prismaClient.my_mnft_metadata;
    console.log("tokenId", tokenId);
    //- 1. tokenUuid 를 통해 연결된 메타데이터를 호출.
    //- 2. myNft uuid -> *token_id*, *nft_con_edition_uuid*
    //- token id -> 토큰 회수
    //- nft_con_edition_uuid (에디션에 저장된 데이터)

    // model nft_con_metadata {
    //   uuid         String       @id @db.Uuid
    //   nft_con_info nft_con_info @relation(fields: [nft_con_uuid], references: [uuid], onDelete: NoAction, onUpdate: NoAction, map: "fkhxp8uif8i5xqjtcc936wiqch9")
    //   nft_con_uuid String       @db.Uuid
    //   isPublic     Boolean
    //   trait_type   String       @db.VarChar(255)
    //   value        String       @db.VarChar(255)
    //   display_type String       @default("string") // number, ranking, date, string, description
    //   max_value    String?      @db.VarChar(255)
    // }

    /**
     * example1 - https://bafybeifvu3booco4q4ehsbg5awcdzgpncbeescs7wl6xipx7axmx4vjaue.ipfs.nftstorage.link/07432.json
     * example2 - https://www.strikers.auction/api/cards/2376
     * example3 - https://opensea.io/assets/ethereum/0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205/47478925951493994487973783441088886802062401247789838014080290470054869167011
     * example3-1 - https://api.sorare.com/api/v1/cards/47478925951493994487973783441088886802062401247789838014080290470054869167011
     * name : name
     * Full Name : attribute
     * edition - number - (stats)
     * Vintage : attribute
     * Capacity : attribute
     * Country : attribute
     * Region1 : attribute - optional
     * Region2 - attribute - optional
     * Type : attribute 
     * Body - number (level)
     * Sweetness - number (level)
     * Acidity - number (level)
     * Tannin - number (level)
     * ABV - attribute
     * Winery - attribute - optional
     * Grape1 - attribute - optional
     * Grape2 - attribute - optional
     * Grape3 - attribute - optional
     * Grape4 - attribute - optional
     * Grape5 - attribute - optional
     * Description - description
    /**
{
  "name": "name",
  "description": "description",
  "image": "image_url",
  "background_color": "#cc3333",
  "attributes": [],
  "sendable": true,
  "send_friend_only": true,
  "external_link": "",
  "external_url": ""
}
     */
    return {
      tokenURI: "hello",
    };
  }

  @Mutation(() => MigrateOutput)
  async migrate(@Arg("input") input: MigrateInput): Promise<MigrateOutput> {
    //- 1. preTokenId, tokenUuid, is_mnft, senderAddress, rlp를 인풋값으로 받는다.
    //
    //- 2. tokenId의 owner가 senderAddress와 일치한지 검증한다.
    //! error.1 owner와 senderAddress가 불일치하면 에러
    //
    //- 3. preTokenId 또는 tokenUuid의 값으로 저장된 메타데이터를 모두 호출한다.
    //
    //- 4. tokenUri 를 생성한다.
    //! error.2 tokenUri 생성이 실패하면 에러
    //! tokenUri 생성시점 vs migrate 시점 고민하기..
    //
    //- 5. rlp를 실행한다.
    //! error.3 rlp가 실패하면 에러
    //
    //- 6. 실행된 rlp의 receipt를 가져와서 새로 생성된 토큰을 받는다.
    return {
      transactionHash: "hello",
    };
  }
}
