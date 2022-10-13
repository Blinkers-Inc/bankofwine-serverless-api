import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";

import { eventKeccak256, functionKeccak256 } from "src/common/constant";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { MyMnftQueryResolver } from "src/resolvers/databases/my-mnft/my-mnft.query.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { MetadataMutationResolver } from "src/resolvers/metadata/metadata.mutation.resolver";
import {
  MigrateInput,
  MigrateOutput,
} from "src/resolvers/migration/dto/migrate.dto";
import { TransactionStatus } from "src/resolvers/transaction/dto/send-raw-transaction.dto";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";

@Service()
@Resolver()
export class MigrationMutationResolver {
  constructor(
    private transaction_mutation_resolver: TransactionMutationResolver,
    private my_nft_con_query_resolver: MyNftConQueryResolver,
    private my_mnft_query_resolver: MyMnftQueryResolver,
    private metadata_mutation_resolver: MetadataMutationResolver
  ) {}
  @Mutation(() => MigrateOutput)
  async migrate(
    @Arg("input") { rlp, my_nft_uuid, is_mnft }: MigrateInput,
    @Ctx() ctx: IContext
  ): Promise<MigrateOutput> {
    //= 1. rlp에 들어간 input값 조회
    const { _input } = ctx.caver.transaction.decode(rlp);

    const migrateLength = functionKeccak256.migrate.length;

    if (_input.slice(0, migrateLength) !== functionKeccak256.migrate) {
      throw new CustomError("invalid transaction call");
    }

    const { "0": inputPreTokenId, "1": _inputIsMnft } =
      ctx.caver.abi.decodeParameters(
        ["uint256", "bool"],
        _input.slice(migrateLength)
      );

    const convertPreTokenId = ctx.caver.utils.toBN(inputPreTokenId).toString();

    //= 2. my_nft_uuid 를 통해 찾은 tokenId와 inputPreTokenId가 동일한지 확인한다.

    let token_id;

    if (is_mnft) {
      ({ token_id } = await this.my_mnft_query_resolver.my_mnft(
        {
          uuid: my_nft_uuid,
        },
        ctx
      ));
    } else {
      ({ token_id } = await this.my_nft_con_query_resolver.my_nft_con(
        {
          uuid: my_nft_uuid,
        },
        ctx
      ));
    }

    const convertTokenId = ctx.caver.utils.toBN(token_id).toString();

    //! error1. token_id 가 없거나 inputPreTokenId와 일치하지 않으면 에러

    if (!convertTokenId || convertTokenId !== convertPreTokenId) {
      throw new CustomError(
        "invalid token id",
        CustomErrorCode.INVALID_TOKEN_ID
      );
    }

    //= 3. raw transaction 실행

    const { status, transactionHash } =
      await this.transaction_mutation_resolver.send_raw_transaction(
        { rlp },
        ctx
      );

    //! error2. transaction 결과가 실패할 경우 에러

    if (status === TransactionStatus.FAILURE) {
      throw new CustomError(
        "transaction failed",
        CustomErrorCode.TRANSACTION_FAILED,
        { transactionHash }
      );
    }

    const receipt = await ctx.caver.rpc.klay.getTransactionReceipt(
      transactionHash
    );

    //= 4. receipt에서 Migrate 이벤트 초회

    const migrateEvent = receipt.logs.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ele: any) => ele.topics[0] === eventKeccak256.Migrate
    );

    //! error3. Migrate 이벤트가 없을 경우 실패로 간주

    if (!migrateEvent.length) {
      throw new CustomError(
        "no exist event log",
        CustomErrorCode.NOT_EXIST_EVENT_LOG,
        {
          my_nft_uuid,
          is_mnft,
          status,
          transactionHash,
        }
      );
    }

    const decodedInput = ctx.caver.abi.decodeParameters(
      ["bool", "uint256", "uint256"],
      migrateEvent[0].data
    );

    const { "0": isMnft, "1": _preTokenId, "2": newTokenId } = decodedInput;

    let token_uri: string;

    if (isMnft) {
      //= 6-1. M-NFT 일경우 M-NFT metadata uri 생성
      ({ token_uri } =
        await this.metadata_mutation_resolver.create_my_mnft_metadata_uri(
          {
            my_mnft_uuid: my_nft_uuid,
            token_id: newTokenId,
          },
          ctx
        ));

      //= 5-1. 성공한 경우 my_mnft DB 업데이트 (token_id, contract_address, updated_at)
      await ctx.prismaClient.my_mnft.update({
        where: {
          uuid: my_nft_uuid,
        },
        data: {
          token_id: newTokenId,
          contract_address: process.env.CUR_M_NFT_CONTRACT_ADDRESS,
          updated_at: new Date(),
        },
      });
    } else {
      //= 6-2. NFT일경우 NFT metadata uri 생성
      ({ token_uri } =
        await this.metadata_mutation_resolver.create_my_nft_con_metadata_uri(
          {
            my_nft_con_uuid: my_nft_uuid,
            token_id: newTokenId,
          },
          ctx
        ));

      //= 5-2. 성공한 경우 my_nft_con DB 업데이트 (token_id, contract_address, updated_at)
      await ctx.prismaClient.my_nft_con.update({
        where: {
          uuid: my_nft_uuid,
        },
        data: {
          token_id: newTokenId,
          contract_address: process.env.CUR_NFT_CONTRACT_ADDRESS,
          updated_at: new Date(),
        },
      });
    }

    return {
      transactionHash,
      token_id: newTokenId,
      token_uri,
    };
  }
}
