import { buildSchemaSync } from "type-graphql";
import { Container } from "typedi";

import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { DepositQueryResolver } from "src/resolvers/databases/deposit/deposit.query.resolver";
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
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { NftConMetadataFieldResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.field.resolver";
import { NftConMetadataMutationResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.mutation.resolver";
import { NftConMetadataQueryResolver } from "src/resolvers/databases/nft-con-metadata/nft-con-metadata.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";
import { MetadataMutationResolver } from "src/resolvers/metadata/metadata.mutation.resolver";
import { MigrationMutationResolver } from "src/resolvers/migration/migration.mutation.resolver";
import { MigrationQueryResolver } from "src/resolvers/migration/migration.query.resolver";
import { TradeLogFieldResolver } from "src/resolvers/trade-log/trade-log.field.resolver";
import { SampleResolver } from "src/resolvers/transaction/sample.query.resolver";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";
import { VaultRelatedEditionFieldResolver } from "src/resolvers/vault/vault.field.resolver";
import { VaultQueryResolver } from "src/resolvers/vault/vault.query.resolver";

export const authChecker = ({ context }: { context: IContext }) => {
  const { Authorization } = context;

  if (!Authorization.length) {
    throw new CustomError(
      "not exist authorization code",
      CustomErrorCode.NOT_EXIST_AUTHORIZATION_CODE
    );
  }

  if (Authorization === "firebase") {
    return true;
  }

  throw new CustomError("Access denied", CustomErrorCode.ACCESS_DENIED, {
    Authorization,
  });
  // return false; // or false if access is denied
};

export const schema = buildSchemaSync({
  authChecker,
  container: Container,
  resolvers: [
    DepositQueryResolver,
    MemberQueryResolver,
    MigrationQueryResolver,
    MyMnftQueryResolver,
    MyNftConQueryResolver,
    NftConEditionQueryResolver,
    NftConInfoQueryResolver,
    NftConMetadataQueryResolver,
    VaultQueryResolver,
    WalletQueryResolver,

    MetadataMutationResolver,
    MigrationMutationResolver,
    MyNftConMutationResolver,
    NftConEditionMutationResolver,
    NftConMetadataMutationResolver,
    TransactionMutationResolver,

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
