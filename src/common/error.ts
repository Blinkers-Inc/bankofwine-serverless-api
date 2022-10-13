import { ApolloError } from "apollo-server-errors";
import { registerEnumType } from "type-graphql";

export enum CustomErrorCode {
  ACCESS_DENIED = "ACCESS_DENIED",
  // ACCESS_TOKEN_EXPIRED = "ACCESS_TOKEN_EXPIRED",
  ALREADY_EXIST = "ALREADY_EXIST",
  EMPTY_TYPE = "EMPTY_TYPE",
  // EXPIRED_VERIFICATION_CODE = "EXPIRED_VERIFICATION_CODE",
  // FAILED_EXECUTE_DATALOADER = "FAILED_EXECUTE_DATALOADER",
  // FAILED_SENDING_MAIL = "FAILED_SENDING_MAIL",
  // INVALID_EMAIL = "INVALID_EMAIL",
  // INVALID_INPUT = "INVALID_INPUT",
  // INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  INVALID_TOKEN_ID = "INVALID_TOKEN_ID",
  // MISMATCHED_VERIFICATION_CODE = "MISMATCHED_VERIFICATION_CODE",
  NOT_EXIST_AUTHORIZATION_CODE = "NOT_EXIST_AUTHORIZATION_CODE",
  NOT_EXIST_EVENT_LOG = "NOT_EXIST_EVENT_LOG",
  // NOT_EXIST_VERIFICATION_CODE = "NOT_EXIST_VERIFICATION_CODE",
  // REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  // USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
}

registerEnumType(CustomErrorCode, {
  name: "CustomErrorCode",
});

export class CustomError extends ApolloError {
  private static readonly ERROR_NAME = "CUSTOM_SERVER_ERROR";
  public errorCode: string = CustomError.ERROR_NAME;

  constructor(message: string, errorCode?: string, data?: any) {
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
