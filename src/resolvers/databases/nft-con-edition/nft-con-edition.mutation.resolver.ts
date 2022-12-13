import { Arg, Authorized, Ctx, Int, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import { dynamoClient } from "src/common/aws";
import { eventKeccak256 } from "src/common/constant";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { sendCustomError, sendSlackNotification } from "src/common/slack";
import { prismaClient } from "src/lib/prisma";
import { Nft_con_edition } from "src/prisma";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { CreateNftConEditionsInput } from "src/resolvers/databases/nft-con-edition/dto/mutation/create-nft-con-editions.dto";
import PurchaseAvailableEditionInput from "src/resolvers/databases/nft-con-edition/dto/mutation/purchase-available-edition.dto";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConEditionMutationService } from "src/resolvers/databases/nft-con-edition/services/nft-con-edition.mutation.service";
import { MetadataMutationResolver } from "src/resolvers/metadata/metadata.mutation.resolver";
import { TransactionStatus } from "src/resolvers/transaction/dto/send-raw-transaction.dto";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";

@Service()
@Resolver(Nft_con_edition)
export class NftConEditionMutationResolver {
  constructor(
    private member_query_resolver: MemberQueryResolver,
    private nft_con_edition_query_resolver: NftConEditionQueryResolver,

    private transaction_mutation_resolver: TransactionMutationResolver,
    private metadata_mutation_resolver: MetadataMutationResolver,

    private deposit_query_resolver: DepositQueryResolver,

    private nftConEditionMutationService: NftConEditionMutationService
  ) {}

  @Authorized()
  @Mutation(() => Int, {
    name: "create_nft_con_editions",
    description:
      "신규 에디션 리스트 생성, 성공시 배치 완료한 수량 리턴(only admin)",
  })
  async createNftConEditions(
    @Arg("input") input: CreateNftConEditionsInput
  ): Promise<number> {
    return this.nftConEditionMutationService.createNftConEditions(input);
  }

  @Authorized()
  @Mutation(() => Nft_con_edition)
  async purchase_available_edition(
    @Arg("input")
    input: PurchaseAvailableEditionInput,
    @Ctx() ctx: IContext
  ): Promise<Nft_con_edition> {
    const { connected_wallet_address, nft_con_edition_uuid } = input;

    const { Authorization: buyerUid, caver } = ctx;

    if (!buyerUid) {
      throw new CustomError(
        "unauthorized",
        CustomErrorCode.UNAUTHORIZED,
        input
      );
    } // header 에 Authorization가 없는 경우

    const nftConEdition =
      await this.nft_con_edition_query_resolver.nft_con_edition({
        uuid: nft_con_edition_uuid,
      });

    if (!nftConEdition.is_active || nftConEdition.status !== "AVAILABLE") {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      ); // nft_con_edition 상태가 유효하지 않은 경우
    }

    const now = new Date();

    if (now.valueOf() < nftConEdition.minting_at.valueOf()) {
      throw new CustomError(
        "invalid date",
        CustomErrorCode.INVALID_DATE,
        input
      ); // 민팅 날짜 이전에 구매를 시도할 경우
    }

    const buyer = await this.member_query_resolver.member({
      member_uid: buyerUid,
    });

    const buyerDeposit = await this.deposit_query_resolver.member_deposit({
      member_uid: buyerUid,
    });

    if (Number(buyerDeposit.avail_deposit_sum) < nftConEdition.price) {
      throw new CustomError(
        "exceed deposit balance",
        CustomErrorCode.EXCEED_DEPOSIT_BALANCE,
        input
      ); // 구매자의 deposit이 부족한 경우
    }

    const safeMintAbi = caver.abi.encodeFunctionCall(
      {
        name: "safeMint",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "_to",
          },
        ],
      },
      [connected_wallet_address]
    );

    const tx = {
      type: "FEE_DELEGATED_SMART_CONTRACT_EXECUTION",
      from: process.env.ADMIN_PUBLIC_KEY,
      to: process.env.CUR_NFT_CONTRACT_ADDRESS,
      value: 0,
      gas: 500000,
      data: safeMintAbi,
    };

    const { rawTransaction } = await caver.klay.accounts.signTransaction(
      tx,
      process.env.ADMIN_PRIVATE_KEY
    );

    await prismaClient.deposit.update({
      where: {
        uuid: buyerDeposit.uuid,
      },
      data: {
        avail_deposit_sum: buyerDeposit.avail_deposit_sum - nftConEdition.price,
        deposit_sum: buyerDeposit.deposit_sum - nftConEdition.price,
      },
    }); // 구매자 deposit 선결제

    let status: TransactionStatus, transactionHash: string;

    try {
      ({ status, transactionHash } =
        await this.transaction_mutation_resolver.send_raw_transaction(
          { rlp: rawTransaction },
          ctx
        ));

      if (status === TransactionStatus.FAILURE) {
        await prismaClient.deposit.update({
          where: {
            uuid: buyerDeposit.uuid,
          },
          data: {
            avail_deposit_sum: buyerDeposit.avail_deposit_sum,
            deposit_sum: buyerDeposit.deposit_sum,
          },
        }); // 트랜잭션 실패시 구매자 deposit 원상 복구

        throw new CustomError(
          "transaction failed",
          CustomErrorCode.TRANSACTION_FAILED,
          { ...input, transactionHash }
        );
      } // transaction 실패할 경우
    } catch (err) {
      console.log("Error :>> ", err);

      await prismaClient.deposit.update({
        where: {
          uuid: buyerDeposit.uuid,
        },
        data: {
          avail_deposit_sum: buyerDeposit.avail_deposit_sum,
          deposit_sum: buyerDeposit.deposit_sum,
        },
      }); // 트랜잭션 실패시 구매자 deposit 원상 복구

      throw new CustomError(
        "transaction failed",
        CustomErrorCode.TRANSACTION_FAILED,
        input
      );
    }

    const receipt = await caver.rpc.klay.getTransactionReceipt(transactionHash);

    const transferEvent = receipt.logs.filter(
      (ele: any) => ele.topics[0] === eventKeccak256.Transfer
    );

    const tokenId = caver.utils
      .toBN(transferEvent[0].topics[transferEvent[0].topics.length - 1])
      .toString(); // topics의 배열 마지막 값이 tokenId

    try {
      await this.metadata_mutation_resolver.create_my_nft_con_metadata_uri({
        my_nft_con_uuid: nft_con_edition_uuid, // 이전 배포에 필수값이므로 내부 로직 수정 (nft_con_edition_uuid 있을 경우 사용하지 않음)
        token_id: tokenId,
        nft_con_edition_uuid,
      });
    } catch (err) {
      console.log("Error :>> ", err);

      sendCustomError({
        code: "메타데이터 생성 오류 : 확인 요망",
        path: "purchase_available_edition",
        message:
          "정상 구매 처리 되었으나 tokenURI 생성에 실패함, 재시도 필요함",
        data: {
          nft_con_edition_uuid,
          tokenId,
        },
      });
    }

    const updateNftConEditionTransaction = prismaClient.nft_con_edition.update({
      where: { uuid: nftConEdition.uuid },
      data: {
        updated_at: now,
        status: "SOLD",
        owner: buyer.name,
      },
    });

    const updateBuyerDepositTransaction = prismaClient.deposit.update({
      where: {
        uuid: buyerDeposit.uuid,
      },
      data: {
        updated_at: now,
      },
    });

    const newDepositTxUuid = uuid();
    const createBuyerDepositTxTransaction = prismaClient.deposit_tx.create({
      data: {
        uuid: newDepositTxUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        deposit_req_amnt: nftConEdition.price,
        deposit_tx_ty: "DEPOSIT",
        tx_approve_at: now,
        tx_request_at: now,
        tx_status: "USE_DEPOSIT_COMPLETE",
        deposit_uuid: buyerDeposit.uuid,
        member_uid: buyerUid,
      },
    });

    const newMyNftConUuid = uuid();
    const createMyNftConTransaction = prismaClient.my_nft_con.create({
      data: {
        uuid: newMyNftConUuid,
        created_at: now,
        is_active: true,
        is_delete: true,
        updated_at: now,
        deposit_at: now,
        status: "PAID",
        member_uid: buyerUid,
        nft_con_edition_uuid: nftConEdition.uuid,
        is_burnt: false,
        token_id: tokenId,
        contract_address: process.env.CUR_NFT_CONTRACT_ADDRESS,
        is_listing: false,
      },
    });

    const newTradeTxUuid = uuid();
    const createTradeTxTransaction = prismaClient.trade_tx.create({
      data: {
        uuid: newTradeTxUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        amount: nftConEdition.price,
        buyeruid: buyerUid,
        buyerwalletaddress: connected_wallet_address,
        issuccess: true,
        selleruid: "JKWghbyuBrSvTIaHNl22XXdkgiv2",
        status: "COMPLETE",
        tx_approve_at: now,
        tx_request_at: now,
        deposit_uuid: buyerDeposit.uuid,
        member_uid: buyerUid,
        mynft_uuid: newMyNftConUuid,
        item_uuid: nftConEdition.uuid,
      },
    });

    try {
      await prismaClient.$transaction([
        updateNftConEditionTransaction,
        updateBuyerDepositTransaction,
        createBuyerDepositTxTransaction,
        createMyNftConTransaction,
        createTradeTxTransaction,
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
            apiName: "purchase_available_edition",
            nftConEditionUuid: nft_con_edition_uuid,
            tokenId,
            buyerUid,
            price: Number(nftConEdition.price),
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
      header: "신규 에디션 구매가 발생했습니다.",
      address: connected_wallet_address,
      memberUid: buyerUid,
      fullName: nftConEdition.nft_con_info?.name ?? "알 수 없음",
      tier: nftConEdition.nft_con_info?.tier ?? "알 수 없음",
      functionName: "purchase_available_edition",
      subTotal: nftConEdition.price.toString(),
      commission: "0",
      total: nftConEdition.price.toString(),
      nftConEditionUuid: nftConEdition.uuid,
    });

    return this.nft_con_edition_query_resolver.nft_con_edition({
      uuid: nftConEdition.uuid,
    });
  }
}
