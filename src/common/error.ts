import { ApolloError } from "apollo-server-errors";
import { registerEnumType } from "type-graphql";

export enum CustomErrorCode {
  ACCESS_DENIED = "ACCESS_DENIED",
  ALREADY_BURNT = "ALREADY_BURNT",
  // ACCESS_TOKEN_EXPIRED = "ACCESS_TOKEN_EXPIRED",
  ALREADY_EXIST = "ALREADY_EXIST",
  ALREADY_LIST = "ALREADY_LIST",
  ALREADY_REDEEM = "ALREADY_REDEEM",
  CANNOT_FIND_OWNER_ADDRESS = "CANNOT_FIND_OWNER_ADDRESS",
  CANNOT_PURCHASE_MINE = "CANNOT_PURCHASE_MINE",
  DB_TRANSACTION_FAILED = "DB_TRANSACTION_FAILED",
  DISAGREE_POLICY = "DISAGREE_POLICY",
  EMPTY_TYPE = "EMPTY_TYPE",
  EXCEED_DEPOSIT_BALANCE = "EXCEED_DEPOSIT_BALANCE",
  // EXPIRED_VERIFICATION_CODE = "EXPIRED_VERIFICATION_CODE",
  // FAILED_EXECUTE_DATALOADER = "FAILED_EXECUTE_DATALOADER",
  // FAILED_SENDING_MAIL = "FAILED_SENDING_MAIL",
  // INVALID_EMAIL = "INVALID_EMAIL",
  INACTIVE_STATUS = "INACTIVE_STATUS",
  INVALID_COMMISSION_PRICE = "INVALID_COMMISSION_PRICE",
  INVALID_DATE = "INVALID_DATE",
  INVALID_LISTING_STATUS = "INVALID_LISTING_STATUS",
  INVALID_OWNER_ADDRESS = "INVALID_OWNER_ADDRESS",
  INVALID_PRICE = "INVALID_PRICE",
  INVALID_PURCHASABLE_STATUS = "INVALID_PURCHASABLE_STATUS",
  INVALID_STATUS = "INVALID_STATUS",
  INVALID_SUB_TOTAL_PRICE = "INVALID_SUB_TOTAL_PRICE",
  // INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  INVALID_TOKEN_ID = "INVALID_TOKEN_ID",
  INVALID_TOTAL_PRICE = "INVALID_TOTAL_PRICE",
  INVALID_TRANSACTION_CALL = "INVALID_TRANSACTION_CALL",
  INVALID_UID = "INVALID_UID",
  MISMATCH_CURRENT_OWNER = "MISMATCH_CURRENT_OWNER",
  NEED_MIGRATION = "NEED_MIGRATION",
  // MISMATCHED_VERIFICATION_CODE = "MISMATCHED_VERIFICATION_CODE",
  NOT_APPROVED = "NOT_APPROVED",
  NOT_BURNT_YET = "NOT_BURNT_YET",
  NOT_EXIST_AUTHORIZATION_CODE = "NOT_EXIST_AUTHORIZATION_CODE",
  NOT_EXIST_EVENT_LOG = "NOT_EXIST_EVENT_LOG",
  NOT_TOKEN_OWNER = "NOT_TOKEN_OWNER",
  // NOT_EXIST_VERIFICATION_CODE = "NOT_EXIST_VERIFICATION_CODE",
  // REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
  // USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
}

registerEnumType(CustomErrorCode, {
  name: "CustomErrorCode",
});

export class CustomError extends ApolloError {
  private static readonly ERROR_NAME = "CUSTOM_SERVER_ERROR";
  public errorCode: string = CustomError.ERROR_NAME;

  constructor(message: string, errorCode?: CustomErrorCode, data?: any) {
    super(message, CustomError.ERROR_NAME);
    Error.captureStackTrace(this, CustomError);

    Object.defineProperty(this, "name", { value: CustomError.ERROR_NAME });

    if (errorCode) {
      this.errorCode = errorCode;
    }

    if (data) {
      this.data = data;
    }
  }
}
