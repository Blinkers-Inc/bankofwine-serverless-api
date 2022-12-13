import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { dynamoClient } from "src/common/aws";
import { functionKeccak256, timestamps } from "src/common/constant";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { sendSlackNotification } from "src/common/slack";
import { prismaClient } from "src/lib/prisma";
import { My_nft_con, Redeem_tx } from "src/prisma";
import { MyNftConStatus } from "src/resolvers/databases/my-nft-con/dto/query/my-nft-con.dto";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { CreateRedeemInput } from "src/resolvers/redeem/dto/create-redeem.dto";
import { PreRedeemNftBurnInput } from "src/resolvers/redeem/dto/pre-redeem-nft-burn.dto";
import { TransactionStatus } from "src/resolvers/transaction/dto/send-raw-transaction.dto";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";

@Service()
@Resolver()
export class RedeemMutationResolver {
  constructor(
    private transaction_mutation_resolver: TransactionMutationResolver,
    private my_nft_con_query_resolver: MyNftConQueryResolver
  ) {}

  @Authorized()
  @Mutation(() => My_nft_con, {
    description: "Redeem 전 nft 소유권을 BlackHole account 로 이전",
  })
  async pre_redeem_nft_burn(
    @Arg("input") input: PreRedeemNftBurnInput,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    const { Authorization: memberUid } = ctx;

    if (!memberUid) {
      throw new CustomError(
        "unauthorized",
        CustomErrorCode.UNAUTHORIZED,
        input
      );
    } //e: header 에 Authorization 없는 경우

    const { rlp, my_nft_con_uuid } = input;

    //= 1. rlp에 들어간 input값 조회

    const { _input } = ctx.caver.transaction.decode(rlp);
    const transferFromLength = functionKeccak256.transferFrom.length;

    if (
      _input.slice(0, transferFromLength) !== functionKeccak256.transferFrom
    ) {
      throw new CustomError(
        "invalid transaction call",
        CustomErrorCode.INVALID_TRANSACTION_CALL
      );
    } //e: 트랙잭션 함수가 transferFrom 이 아닌 경우

    //= 2. rlp decode 값과 DB값 일치하는 지 확인

    const {
      "0": from,
      "1": to,
      "2": tokenId,
    } = ctx.caver.abi.decodeParameters(
      ["uint256", "bool"],
      _input.slice(transferFromLength)
    );
    const convertInputTokenId = ctx.caver.utils.toBN(tokenId).toString();

    const myNftCon = await this.my_nft_con_query_resolver.my_nft_con({
      uuid: my_nft_con_uuid,
    });

    const convertTokenId = ctx.caver.utils.toBN(myNftCon.token_id).toString();

    if (!convertTokenId || convertTokenId !== convertInputTokenId) {
      throw new CustomError(
        "invalid token id",
        CustomErrorCode.INVALID_TOKEN_ID
      );
    } //e: 트랜잭션 내 tokenId와 유저의 tokenId가 불일치한 경우

    const tokenOwnerAddress =
      await this.my_nft_con_query_resolver.token_owner_address(
        {
          token_id: tokenId,
          contract_address: myNftCon.contract_address ?? undefined,
        },
        ctx
      );

    if (
      !tokenOwnerAddress ||
      tokenOwnerAddress.toLowerCase() !== from.toLowerCase()
    ) {
      throw new CustomError(
        "not token owner",
        CustomErrorCode.NOT_TOKEN_OWNER,
        input
      );
    } //e: rlp의 from 과 tokenOwnerAddress 가 불일치한 경우

    //= 3. raw transaction 실행

    const { status, transactionHash } =
      await this.transaction_mutation_resolver.send_raw_transaction(
        { rlp },
        ctx
      );

    if (status === TransactionStatus.FAILURE) {
      throw new CustomError(
        "transaction failed",
        CustomErrorCode.TRANSACTION_FAILED,
        { transactionHash }
      );
    } //e: 트랜잭션 실패할 경우

    return prismaClient.my_nft_con.update({
      where: {
        uuid: my_nft_con_uuid,
      },
      data: {
        is_burnt: true,
        updated_at: new Date(),
      },
    });
  }

  @Authorized()
  @Mutation(() => Redeem_tx, { description: "Redeem 신청" })
  async create_redeem(
    @Arg("input") input: CreateRedeemInput,
    @Ctx() ctx: IContext
  ): Promise<Redeem_tx> {
    const { Authorization: memberUid } = ctx;

    if (!memberUid) {
      throw new CustomError(
        "unauthorized",
        CustomErrorCode.UNAUTHORIZED,
        input
      );
    } //e: header 에 Authorization 없는 경우

    const { my_nft_con_uuid, location_cd, redeem_dt, plcy_agreed } = input;

    const myNftCon = await this.my_nft_con_query_resolver.my_nft_con({
      uuid: my_nft_con_uuid,
    });

    if (!myNftCon.is_burnt) {
      throw new CustomError(
        "not burnt yet",
        CustomErrorCode.NOT_BURNT_YET,
        input
      );
    } //e: is_burnt 상태가 true가 아닌 경우

    if (!plcy_agreed) {
      throw new CustomError(
        "disagree policy",
        CustomErrorCode.DISAGREE_POLICY,
        input
      );
    } //e: 비동의 상태인 경우

    const redeemTx = await prismaClient.redeem_tx.findFirst({
      where: {
        mynft_uuid: my_nft_con_uuid,
        is_active: true,
      },
    });

    if (redeemTx) {
      throw new CustomError(
        "redeem already",
        CustomErrorCode.ALREADY_REDEEM,
        input
      );
    } //e: 이미 리딤한 상태인 경우

    const redeemAtTimestamp = new Date(redeem_dt).valueOf();
    const weekLaterTimestamp =
      new Date().valueOf() + timestamps.ONE_WEEK_MILLISECONDS;

    if (redeemAtTimestamp < weekLaterTimestamp) {
      throw new CustomError(
        "invalid date",
        CustomErrorCode.INVALID_DATE,
        input
      );
    }

    const now = new Date();

    const myNftConUpdateTransaction = prismaClient.my_nft_con.update({
      where: {
        uuid: my_nft_con_uuid,
      },
      data: {
        status: MyNftConStatus.REDEEM_PENDING,
        updated_at: now,
      },
    });

    const redeemTxUuid = uuid();
    const redeemTxCreateTransaction = prismaClient.redeem_tx.create({
      data: {
        uuid: redeemTxUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        location_cd,
        plcy_agreed,
        redeem_dt,
        tx_request_at: now,
        member_uid: memberUid,
        mynft_uuid: my_nft_con_uuid,
      },
    });

    try {
      await prismaClient.$transaction([
        myNftConUpdateTransaction,
        redeemTxCreateTransaction,
      ]);
    } catch (err) {
      console.log("Error :>> ", err);

      const dynamoUuid = uuid();
      await dynamoClient
        .put({
          TableName: `bankofwine-api-log-${process.env.STAGE}`,
          Item: {
            id: dynamoUuid,
            createdAt: now.valueOf().toString(),
            apiName: "create_redeem",
            redeemTxUuid,
            locationCode: location_cd,
            policyAgreed: plcy_agreed,
            memberUid,
            myNftConUuid: my_nft_con_uuid,
          },
        })
        .promise();

      throw new CustomError(
        "db transaction failed",
        CustomErrorCode.DB_TRANSACTION_FAILED,
        { ...input, dynamoUuid }
      );
    }

    await sendSlackNotification({
      header: "현물교환 신청이 도착했습니다.",
      address: `신청인 : ${myNftCon.member?.name}`,
      memberUid,
      fullName: myNftCon.nft_con_edition?.nft_con_info?.name ?? "알 수 없음",
      tier: myNftCon.nft_con_edition?.nft_con_info?.tier ?? "알 수 없음",
      functionName: "create_redeem",
      subTotal: `교환 지점 : ${location_cd}`,
      commission: `교환 일시 : ${redeem_dt}`,
      total: "0",
      nftConEditionUuid: myNftCon.nft_con_edition_uuid,
    });

    return prismaClient.redeem_tx.findUniqueOrThrow({
      where: {
        uuid: redeemTxUuid,
      },
    });
  }
}
