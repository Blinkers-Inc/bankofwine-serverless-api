import axios from "axios";
import { buildSchemaSync } from "type-graphql";
import { Container } from "typedi";

import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { prismaClient } from "src/lib/prisma";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";
import { DepositTxFieldResolver } from "src/resolvers/databases/deposit-tx/deposit-tx.field.resolver";
import { DepositTxMutationResolver } from "src/resolvers/databases/deposit-tx/deposit-tx.mutation.resolver";
import { DepositTxQueryResolver } from "src/resolvers/databases/deposit-tx/deposit-tx.query.resolver";
import { MarketTradeLogFieldResolver } from "src/resolvers/databases/market-trade-log/market-trade-log.field.resolver";
import { MemberFieldResolver } from "src/resolvers/databases/member/member.field.resolver";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyMnftFieldResolver } from "src/resolvers/databases/my-mnft/my-mnft.field.resolver";
import { MyMnftQueryResolver } from "src/resolvers/databases/my-mnft/my-mnft.query.resolver";
import { MyNftConFieldResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.field.resolver";
import { MyNftConMutationResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.mutation.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { NftConEditionFieldResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.field.resolver";
import { NftConEditionMutationResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.mutation.resolver";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConInfoFieldResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.field.resolver";
import { NftConInfoMutationResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.mutation.resolver";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { NftConMetadataFieldResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.field.resolver";
import { NftConMetadataMutationResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.mutation.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";
import { MetadataMutationResolver } from "src/resolvers/metadata/metadata.mutation.resolver";
import { MigrationMutationResolver } from "src/resolvers/migration/migration.mutation.resolver";
import { MigrationQueryResolver } from "src/resolvers/migration/migration.query.resolver";
import { RedeemMutationResolver } from "src/resolvers/redeem/redeem.mutation.resolver";
import { TradeLogFieldResolver } from "src/resolvers/trade-log/trade-log.field.resolver";
import { SampleResolver } from "src/resolvers/transaction/sample.query.resolver";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";
import { VaultRelatedEditionFieldResolver } from "src/resolvers/vault/vault.field.resolver";
import { VaultQueryResolver } from "src/resolvers/vault/vault.query.resolver";

export const customAuthChecker = async ({ context }: { context: IContext }) => {
  const { Authorization: authKey, isAdmin } = context;

  if (authKey === process.env.ADMIN_KEY) {
    return true;
  }

  if (!authKey) {
    throw new CustomError("access denied", CustomErrorCode.ACCESS_DENIED, {
      authKey,
      isAdmin,
    });
  }

  // ADMIN은 로그인 후 생성된 idToken 을 통해 검증
  if (isAdmin === "true") {
    try {
      const { status } = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.ADMIN_FIREBASE_API_KEY}`,
        { idToken: authKey }
      );

      if (status === 200) {
        return true;
      }

      throw new CustomError("access denied", CustomErrorCode.ACCESS_DENIED, {
        authKey,
        isAdmin,
      });
    } catch {
      throw new CustomError("access denied", CustomErrorCode.ACCESS_DENIED, {
        authKey,
        isAdmin,
      });
    }
  }

  const member = await prismaClient.member.findUnique({
    where: { uid: authKey },
  });

  if (!member) {
    throw new CustomError("access denied", CustomErrorCode.ACCESS_DENIED, {
      authKey,
      isAdmin,
    });
  }

  return true;
};

export const schema = buildSchemaSync({
  authChecker: customAuthChecker,
  container: Container,
  resolvers: [
    DepositQueryResolver,
    DepositTxQueryResolver,
    MemberQueryResolver,
    MigrationQueryResolver,
    MyMnftQueryResolver,
    MyNftConQueryResolver,
    NftConEditionQueryResolver,
    NftConInfoQueryResolver,
    NftConMetadataQueryResolver,
    VaultQueryResolver,
    WalletQueryResolver,

    DepositTxMutationResolver,
    MetadataMutationResolver,
    MigrationMutationResolver,
    MyNftConMutationResolver,
    NftConEditionMutationResolver,
    NftConInfoMutationResolver,
    NftConMetadataMutationResolver,
    RedeemMutationResolver,
    TransactionMutationResolver,

    DepositTxFieldResolver,
    MarketTradeLogFieldResolver,
    MemberFieldResolver,
    MyNftConFieldResolver,
    MyMnftFieldResolver,
    NftConEditionFieldResolver,
    NftConInfoFieldResolver,
    NftConMetadataFieldResolver,
    TradeLogFieldResolver,
    VaultRelatedEditionFieldResolver,

    SampleResolver,
  ],
});
