import { Arg, Mutation, Resolver } from "type-graphql";

import {
  MigrateInput,
  MigrateOutput,
} from "src/resolvers/migration/dto/migrate.dto";

@Resolver()
export class MigrationMutationResolver {
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
