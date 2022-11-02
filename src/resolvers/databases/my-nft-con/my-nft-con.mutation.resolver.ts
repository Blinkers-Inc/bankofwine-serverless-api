import { Arg, Ctx, Directive, Mutation, Resolver } from "type-graphql";
import { Service } from "typedi";
import { v4 as uuid } from "uuid";

import {
  COMMISSION_PERCENTAGE,
  MAXIMUM_LISTING_PRICE,
  MINIMUM_LISTING_PRICE,
} from "src/common/constant";
import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { AdminDepositStatus, MarketTradeStatus, My_nft_con } from "src/prisma";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";
import { CancelListInput } from "src/resolvers/databases/my-nft-con/dto/mutation/cancel-list.dto";
import { CreateListInput } from "src/resolvers/databases/my-nft-con/dto/mutation/create-list.dto";
import PurchaseListInput from "src/resolvers/databases/my-nft-con/dto/mutation/purchase-list.dto";
import { MyNftConFieldResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.field.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { NftConEditionPurchasableStatus } from "src/resolvers/databases/nft-con-edition/dto/field/nft-con-edition-status.dto";
import { NftConEditionFieldResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.field.resolver";
import { MigrationQueryResolver } from "src/resolvers/migration/migration.query.resolver";
import { TransactionStatus } from "src/resolvers/transaction/dto/send-raw-transaction.dto";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";

@Service()
@Resolver(My_nft_con)
export class MyNftConMutationResolver {
  constructor(
    private deposit_query_resolver: DepositQueryResolver,
    private migration_query_resolver: MigrationQueryResolver,
    private my_nft_con_query_resolver: MyNftConQueryResolver,

    private transaction_mutation_resolver: TransactionMutationResolver,

    private my_nft_con_field_resolver: MyNftConFieldResolver,
    private nft_con_edition_field_resolver: NftConEditionFieldResolver
  ) {}

  @Mutation(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async create_list(
    @Arg("input")
    input: CreateListInput,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    const {
      my_nft_con_uuid,
      connected_wallet_address,
      sub_total,
      commission,
      total,
    } = input;

    const { uid, prismaClient } = ctx;

    if (!uid) {
      throw new CustomError("miss uid", CustomErrorCode.MISS_UID, input);
    } // header 에 uid가 없는 경우

    const isApprovedForAll =
      await this.migration_query_resolver.is_approved_for_all(
        {
          owner: connected_wallet_address,
          operator: process.env.CONTRACT_OWNER_ADDRESS,
          nft_contract: process.env.CUR_NFT_CONTRACT_ADDRESS,
        },
        ctx
      );

    if (!isApprovedForAll) {
      throw new CustomError(
        "not approved",
        CustomErrorCode.NOT_APPROVED,
        input
      );
    } // 연결된 지갑이 approve 상태가 아닌 경우

    const myNftCon = await prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: my_nft_con_uuid,
      },
      include: {
        nft_con_edition: true,
      },
    });

    const { uid: currentOwnerUid } =
      await this.my_nft_con_field_resolver.current_owner(myNftCon, ctx);

    if (uid !== currentOwnerUid) {
      throw new CustomError(
        "mismatch current owner",
        CustomErrorCode.MISMATCH_CURRENT_OWNER,
        input
      );
    } // 소유주와 일치하지 않은 경우

    if (
      !myNftCon.is_active ||
      myNftCon.status !== "PAID" ||
      !myNftCon.token_id
    ) {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    } // 유효하지 않은 my_nft_con 의 상태

    if (myNftCon.is_burnt) {
      throw new CustomError(
        "already burnt",
        CustomErrorCode.ALREADY_BURNT,
        input
      );
    } // is_burnt 상태가 true인 경우

    if (myNftCon.contract_address !== process.env.CUR_NFT_CONTRACT_ADDRESS) {
      throw new CustomError(
        "need migration",
        CustomErrorCode.NEED_MIGRATION,
        input
      );
    } // 컨트랙트 address가 불일치한 경우 (마이그레이션 필요)
    const marketTradeLogs = await prismaClient.market_trade_log.findMany({
      take: 1,
      where: {
        my_nft_con_uuid: myNftCon.uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (
      myNftCon.is_listing === true ||
      (marketTradeLogs.length &&
        marketTradeLogs[0].status === MarketTradeStatus.LIST)
    ) {
      throw new CustomError(
        "already list",
        CustomErrorCode.ALREADY_LIST,
        input
      );
    } // is_listing 상태가 true인 경우

    const purchasableStatus =
      await this.nft_con_edition_field_resolver.purchasable_status(
        myNftCon.nft_con_edition,
        ctx
      );

    if (purchasableStatus !== NftConEditionPurchasableStatus.SOLD) {
      throw new CustomError(
        "invalid purchasable status",
        CustomErrorCode.INVALID_PURCHASABLE_STATUS,
        input
      );
    } // SOLD 상태가 아닌 경우

    if (
      sub_total < MINIMUM_LISTING_PRICE ||
      MAXIMUM_LISTING_PRICE < sub_total ||
      sub_total % MINIMUM_LISTING_PRICE !== 0
    ) {
      throw new CustomError(
        "invalid listing price",
        CustomErrorCode.INVALID_SUB_TOTAL_PRICE,
        input
      );
    } // 1000 <= sub_total <= 10억, 1000 단위로 나눠떨어지지 않으면 invalid

    if (sub_total * COMMISSION_PERCENTAGE !== commission) {
      throw new CustomError(
        "invalid commission price",
        CustomErrorCode.INVALID_COMMISSION_PRICE,
        input
      );
    } // sub_total * 0.05 = commission 이 아니면 에러

    if (sub_total + commission !== total) {
      throw new CustomError(
        "invalid total price",
        CustomErrorCode.INVALID_TOTAL_PRICE,
        input
      );
    } // sub_total + commission = total 이 아니면 에러

    const myNftConTransaction = prismaClient.my_nft_con.update({
      where: { uuid: myNftCon.uuid },
      data: {
        is_listing: true,
      },
    });

    const now = new Date();

    const marketTradeLogTransaction = prismaClient.market_trade_log.create({
      data: {
        uuid: uuid(),
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        status: MarketTradeStatus.LIST,
        sub_total,
        commission,
        total,
        my_nft_con_uuid: myNftCon.uuid,
        from: uid,
      },
    });

    try {
      await prismaClient.$transaction([
        myNftConTransaction,
        marketTradeLogTransaction,
      ]);
    } catch (err) {
      console.log(err);

      throw new CustomError(
        "db transaction failed",
        CustomErrorCode.DB_TRANSACTION_FAILED,
        input
      );
    }

    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: my_nft_con_uuid,
      },
    });
  }

  @Mutation(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async cancel_list(
    @Arg("input")
    input: CancelListInput,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    const { my_nft_con_uuid, connected_wallet_address } = input;

    const { uid, prismaClient } = ctx;

    if (!uid) {
      throw new CustomError("miss uid", CustomErrorCode.MISS_UID, input);
    } // header 에 uid가 없는 경우

    const isApprovedForAll =
      await this.migration_query_resolver.is_approved_for_all(
        {
          owner: connected_wallet_address,
          operator: process.env.CONTRACT_OWNER_ADDRESS,
          nft_contract: process.env.CUR_NFT_CONTRACT_ADDRESS,
        },
        ctx
      );

    if (!isApprovedForAll) {
      throw new CustomError(
        "not approved",
        CustomErrorCode.NOT_APPROVED,
        input
      );
    } // 연결된 지갑이 approve 상태가 아닌 경우

    const myNftCon = await prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: my_nft_con_uuid,
      },
      include: {
        nft_con_edition: true,
      },
    });

    const { uid: currentOwnerUid } =
      await this.my_nft_con_field_resolver.current_owner(myNftCon, ctx);

    if (uid !== currentOwnerUid) {
      throw new CustomError(
        "mismatch current owner",
        CustomErrorCode.MISMATCH_CURRENT_OWNER,
        input
      );
    } // 소유주와 일치하지 않은 경우

    if (
      !myNftCon.is_active ||
      myNftCon.status !== "PAID" ||
      !myNftCon.token_id
    ) {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    } // 유효하지 않은 my_nft_con 의 상태

    if (myNftCon.is_burnt) {
      throw new CustomError(
        "already burnt",
        CustomErrorCode.ALREADY_BURNT,
        input
      );
    } // is_burnt 상태가 true인 경우

    if (myNftCon.contract_address !== process.env.CUR_NFT_CONTRACT_ADDRESS) {
      throw new CustomError(
        "need migration",
        CustomErrorCode.NEED_MIGRATION,
        input
      );
    } // 컨트랙트 address가 불일치한 경우 (마이그레이션 필요)

    const marketTradeLogs = await prismaClient.market_trade_log.findMany({
      take: 1,
      where: {
        my_nft_con_uuid: myNftCon.uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (
      myNftCon.is_listing !== true ||
      !marketTradeLogs.length ||
      marketTradeLogs[0].status !== MarketTradeStatus.LIST
    ) {
      throw new CustomError(
        "invalid listing status",
        CustomErrorCode.INVALID_LISTING_STATUS,
        input
      );
    } // listing 상태가 아닌 경우

    const purchasableStatus =
      await this.nft_con_edition_field_resolver.purchasable_status(
        myNftCon.nft_con_edition,
        ctx
      );

    if (purchasableStatus !== NftConEditionPurchasableStatus.PURCHASABLE) {
      throw new CustomError(
        "invalid purchasable status",
        CustomErrorCode.INVALID_PURCHASABLE_STATUS,
        input
      );
    } // PURCHASABLE 상태가 아닌 경우

    const { sub_total, commission, total } = marketTradeLogs[0];

    const myNftConTransaction = prismaClient.my_nft_con.update({
      where: { uuid: myNftCon.uuid },
      data: {
        is_listing: false,
      },
    });

    const now = new Date();

    const marketTradeLogTransaction = prismaClient.market_trade_log.create({
      data: {
        uuid: uuid(),
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        status: MarketTradeStatus.LIST_CANCEL, // LIST_CANCEL
        sub_total,
        commission,
        total,
        my_nft_con_uuid: myNftCon.uuid,
        from: uid,
      },
    });

    try {
      await prismaClient.$transaction([
        myNftConTransaction,
        marketTradeLogTransaction,
      ]);
    } catch (err) {
      console.log(err);

      throw new CustomError(
        "db transaction failed",
        CustomErrorCode.DB_TRANSACTION_FAILED,
        input
      );
    }

    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: my_nft_con_uuid,
      },
    });
  }

  @Mutation(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async purchase_list(
    @Arg("input")
    input: PurchaseListInput,
    @Ctx() ctx: IContext
  ): Promise<My_nft_con> {
    const { connected_wallet_address, my_nft_con_uuid } = input;

    const { uid: buyerUid, prismaClient, caver } = ctx;

    if (!buyerUid) {
      throw new CustomError("miss uid", CustomErrorCode.MISS_UID, input);
    } // header 에 uid가 없는 경우

    const myNftCon = await prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: my_nft_con_uuid,
      },
      include: {
        nft_con_edition: true,
      },
    });

    if (
      !myNftCon.is_active ||
      myNftCon.status !== "PAID" ||
      !myNftCon.token_id
    ) {
      throw new CustomError(
        "invalid status",
        CustomErrorCode.INVALID_STATUS,
        input
      );
    } // 유효하지 않은 my_nft_con 의 상태

    if (myNftCon.is_burnt) {
      throw new CustomError(
        "already burnt",
        CustomErrorCode.ALREADY_BURNT,
        input
      );
    } // is_burnt 상태가 true인 경우

    if (myNftCon.contract_address !== process.env.CUR_NFT_CONTRACT_ADDRESS) {
      throw new CustomError(
        "need migration",
        CustomErrorCode.NEED_MIGRATION,
        input
      );
    } // 컨트랙트 address가 불일치한 경우 (마이그레이션 필요)

    const marketTradeLogs = await prismaClient.market_trade_log.findMany({
      take: 1,
      where: {
        my_nft_con_uuid: myNftCon.uuid,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (
      myNftCon.is_listing !== true ||
      !marketTradeLogs.length ||
      marketTradeLogs[0].status !== MarketTradeStatus.LIST
    ) {
      throw new CustomError(
        "invalid listing status",
        CustomErrorCode.INVALID_LISTING_STATUS,
        input
      );
    } // is_listing 상태가 false인 경우

    const { uid: sellerUid } =
      await this.my_nft_con_field_resolver.current_owner(myNftCon, ctx);

    if (buyerUid === sellerUid) {
      throw new CustomError(
        "can't purchase mine",
        CustomErrorCode.CANNOT_PURCHASE_MINE,
        input
      );
    } // 소유주와 일치한 경우

    const purchasableStatus =
      await this.nft_con_edition_field_resolver.purchasable_status(
        myNftCon.nft_con_edition,
        ctx
      );

    if (purchasableStatus !== NftConEditionPurchasableStatus.PURCHASABLE) {
      throw new CustomError(
        "invalid purchasable status",
        CustomErrorCode.INVALID_PURCHASABLE_STATUS,
        input
      );
    } // PURCHASABLE 상태가 아닌 경우

    const tokenOwnerAddress =
      await this.my_nft_con_query_resolver.token_owner_address(
        {
          token_id: myNftCon.token_id,
          contract_address: myNftCon.contract_address,
        },
        ctx
      );

    if (!tokenOwnerAddress) {
      throw new CustomError(
        "can't find owner address",
        CustomErrorCode.CANNOT_FIND_OWNER_ADDRESS,
        input
      );
    } // token owner 가 없는 경우

    const isSellerApprovedForAll =
      await this.migration_query_resolver.is_approved_for_all(
        {
          owner: tokenOwnerAddress,
          operator: process.env.CONTRACT_OWNER_ADDRESS,
          nft_contract: myNftCon.contract_address,
        },
        ctx
      );

    if (!isSellerApprovedForAll) {
      throw new CustomError(
        "not approved",
        CustomErrorCode.NOT_APPROVED,
        input
      );
    } // seller 가 트랜잭션 승인을 하지 않은 경우

    const buyerDeposit = await this.deposit_query_resolver.deposit(
      {
        member_uid: buyerUid,
      },
      ctx
    );

    const { sub_total, commission, total } = marketTradeLogs[0];

    if (Number(buyerDeposit.avail_deposit_sum) < total) {
      throw new CustomError(
        "exceed deposit balance",
        CustomErrorCode.EXCEED_DEPOSIT_BALANCE,
        input
      ); // 구매자의 deposit이 부족한 경우
    }

    const safeTransferFromAbi = caver.abi.encodeFunctionCall(
      {
        name: "safeTransferFrom",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "from",
          },
          {
            type: "address",
            name: "to",
          },
          {
            type: "uint256",
            name: "tokenId",
          },
        ],
      },
      [tokenOwnerAddress, connected_wallet_address, myNftCon.token_id]
    );

    const tx = {
      type: "FEE_DELEGATED_SMART_CONTRACT_EXECUTION",
      from: process.env.ADMIN_PUBLIC_KEY,
      to: myNftCon.contract_address,
      value: 0,
      gas: 500000,
      data: safeTransferFromAbi,
    };

    const { rawTransaction } = await caver.klay.accounts.signTransaction(
      tx,
      process.env.ADMIN_PRIVATE_KEY
    );

    const { status, transactionHash } =
      await this.transaction_mutation_resolver.send_raw_transaction(
        { rlp: rawTransaction },
        ctx
      );

    if (status === TransactionStatus.FAILURE) {
      throw new CustomError(
        "transaction failed",
        CustomErrorCode.TRANSACTION_FAILED,
        { ...input, transactionHash }
      );
    } // transaction 실패할 경우

    const now = new Date();

    const buyerSpend = total;
    const sellerEarn = sub_total - commission;
    const adminCommission = buyerSpend - sellerEarn;

    const sellerDeposit = await this.deposit_query_resolver.deposit(
      {
        member_uid: sellerUid,
      },
      ctx
    );

    // 구매자 deposit
    const buyerDepositTransaction = prismaClient.deposit.update({
      where: {
        uuid: buyerDeposit.uuid,
      },
      data: {
        avail_deposit_sum: buyerDeposit.avail_deposit_sum! - buyerSpend,
        deposit_sum: buyerDeposit.deposit_sum! - buyerSpend,
        updated_at: now,
      },
    });

    // 판매자 deposit
    const sellerDepositTransaction = prismaClient.deposit.update({
      where: {
        uuid: sellerDeposit.uuid,
      },
      data: {
        updated_at: now,
        avail_deposit_sum: sellerDeposit.avail_deposit_sum! + sellerEarn,
        deposit_sum: sellerDeposit.deposit_sum! + sellerEarn,
      },
    });

    // market_trade_log
    const marketTradeLogUuid = uuid();
    const marketTradeLogTransaction = prismaClient.market_trade_log.create({
      data: {
        uuid: marketTradeLogUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        status: MarketTradeStatus.PURCHASE,
        sub_total,
        commission,
        total,
        my_nft_con_uuid: myNftCon.uuid,
        from: sellerUid,
        to: buyerUid,
      },
    });

    // admin_deposit
    const adminDepositUuid = uuid();
    const adminDepositTransaction = prismaClient.admin_deposit.create({
      data: {
        uuid: adminDepositUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        status: AdminDepositStatus.DEPOSIT,
        price: adminCommission,
        my_nft_con_uuid: myNftCon.uuid,
        market_trade_log_uuid: marketTradeLogUuid,
      },
    });

    const marketTradeTxUuid = uuid();
    const marketTradeTxTransaction = prismaClient.market_trade_tx.create({
      data: {
        uuid: marketTradeTxUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        buyer_uid: buyerUid,
        buyer_wallet_address: connected_wallet_address,
        buyer_spend: buyerSpend,
        seller_earn: sellerEarn,
        admin_commission: adminCommission,
        seller_uid: sellerUid,
        seller_wallet_address: tokenOwnerAddress,
        status: MarketTradeStatus.PURCHASE,
        transaction_hash: transactionHash,
        my_nft_con_uuid: myNftCon.uuid,
        nft_con_edition_uuid: myNftCon.nft_con_edition_uuid,
        market_trade_log_uuid: marketTradeLogUuid,
        admin_deposit_uuid: adminDepositUuid,
      },
    });

    // 기존 NFT 삭제 처리
    const myNftConDeleteTransaction = prismaClient.my_nft_con.update({
      where: { uuid: myNftCon.uuid },
      data: {
        is_active: false,
        is_delete: true,
        updated_at: now,
      },
    });

    // 신규 NFT 생성
    const newMyNftConUuid = uuid();
    const newMyNftConTransaction = prismaClient.my_nft_con.create({
      data: {
        uuid: newMyNftConUuid,
        created_at: now,
        is_active: true,
        is_delete: false,
        updated_at: now,
        deposit_at: now,
        seller_id: myNftCon.member_uid,
        status: myNftCon.status,
        member_uid: buyerUid,
        nft_con_edition_uuid: myNftCon.nft_con_edition_uuid,
        is_burnt: myNftCon.is_burnt,
        token_id: myNftCon.token_id,
        contract_address: myNftCon.contract_address,
        is_listing: false,
      },
    });

    try {
      await prismaClient.$transaction([
        buyerDepositTransaction,
        sellerDepositTransaction,
        marketTradeLogTransaction,
        marketTradeTxTransaction,
        myNftConDeleteTransaction,
        newMyNftConTransaction,
        adminDepositTransaction,
      ]);
    } catch (err) {
      console.log(err);

      throw new CustomError(
        "db transaction failed",
        CustomErrorCode.DB_TRANSACTION_FAILED,
        input
      );
    }

    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: {
        uuid: newMyNftConUuid,
      },
    });
  }
}
