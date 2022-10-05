import { buildSchemaSync } from "type-graphql";
import { Container } from "typedi";

import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { BannerQueryResolver } from "src/resolvers/databases/banner/banner.query.resolver";
import { MemberFieldResolver } from "src/resolvers/databases/member/member.field.resolver";
import { MemberQueryResolver } from "src/resolvers/databases/member/member.query.resolver";
import { MyMnftQueryResolver } from "src/resolvers/databases/my-mnft/my-mnft.query.resolver";
import { MyNftConFieldResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.field.resolver";
import { MyNftConQueryResolver } from "src/resolvers/databases/my-nft-con/my-nft-con.query.resolver";
import { MyNftConMetadataMutationResolver } from "src/resolvers/databases/my-nft-con-metadata/my-nft-con-metadata.mutation.resolver";
import { MyNftConMetadataQueryResolver } from "src/resolvers/databases/my-nft-con-metadata/my-nft-con-metadata.query.resolver";
import { NftConEditionFieldResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.field.resolver";
import { NftConEditionQueryResolver } from "src/resolvers/databases/nft-con-edition/nft-con-edition.query.resolver";
import { NftConInfoQueryResolver } from "src/resolvers/databases/nft-con-info/nft-con-info.query.resolver";
import { WalletQueryResolver } from "src/resolvers/databases/wallet/wallet.query.resolver";
import { MigrationMutationResolver } from "src/resolvers/migration/migration.mutation.resolver";
import { SampleResolver } from "src/resolvers/transaction/sample.query.resolver";
import { TransactionMutationResolver } from "src/resolvers/transaction/transaction.mutation.resolver";

export const authChecker = ({ context }: { context: IContext }) => {
  const { Authorization } = context;
  console.log("Authorization", Authorization);

  if (!Authorization.length) {
    throw new CustomError(
      "not exist authorization code",
      CustomErrorCode.NOT_EXIST_AUTHORIZATION_CODE
    );
  }

  if (Authorization === "firebase") {
    return true;
  }

  throw new CustomError("Access denied", CustomErrorCode.ACCESS_DENIED);
  // return false; // or false if access is denied
};

export const schema = buildSchemaSync({
  authChecker,
  container: Container,
  resolvers: [
    BannerQueryResolver,
    MemberFieldResolver,
    MemberQueryResolver,
    MigrationMutationResolver,
    MyMnftQueryResolver,
    MyNftConMetadataMutationResolver,
    MyNftConMetadataQueryResolver,
    MyNftConQueryResolver,
    MyNftConFieldResolver,
    NftConEditionQueryResolver,
    NftConEditionFieldResolver,
    NftConInfoQueryResolver,
    SampleResolver,
    TransactionMutationResolver,
    WalletQueryResolver,
  ],
});
