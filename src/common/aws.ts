import S3 from "aws-sdk/clients/s3";

const AWS_REGION = "ap-northeast-2";

export const s3 = new S3({ region: AWS_REGION });
