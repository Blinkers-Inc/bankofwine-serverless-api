import { CustomError, CustomErrorCode } from "src/common/error";
import { IContext } from "src/common/interfaces/context";
import { BannerResolver } from "src/resolvers/banner/banner.query.resolver";
import { MyMnftResolver } from "src/resolvers/my-mnft/my-mnft.query.resolver";
import { MyNftResolver } from "src/resolvers/my-nft/my-nft.query.resolver";
import { SampleResolver } from "src/resolvers/others/hello.query.resolver";
import { TransactionMutationResolver } from "src/resolvers/others/transaction.mutation.resolver";
import { buildSchemaSync } from "type-graphql";

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
  resolvers: [
    BannerResolver,
    MyMnftResolver,
    MyNftResolver,
    SampleResolver,
    TransactionMutationResolver,
  ],
  authChecker,
});
