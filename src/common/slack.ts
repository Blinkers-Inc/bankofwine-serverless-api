import { IncomingWebhook } from "@slack/webhook";

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);

export const sendCustomError = async (input: {
  code?: string;
  data?: any;
  errorCode?: string;
  message?: string;
  path?: any;
}) => {
  const { code, errorCode, message, path, data } = input;

  const slackMessage = {
    text: `Graphql 에러 발생 : ${process.env.STAGE}`,
    attachments: [
      {
        title: `code : ${code ? code : "none"}`,
        value: code,
        short: true,
      },
      {
        title: `errorCode : ${errorCode ? errorCode : "none"}`,
        short: true,
      },
      {
        title: `path : ${path ? JSON.stringify(path) : "none"}`,
        short: false,
      },
      {
        title: `message : ${message ? JSON.stringify(message) : "none"}`,
        short: false,
      },
      {
        title: `data: ${data ? JSON.stringify(data) : "none"}`,
        short: false,
      },
    ],
  };

  try {
    await webhook.send(slackMessage);
    console.log("슬랙 전송 완료");
  } catch (err) {
    console.log("err", err);
    console.log("슬랙 전송 중 오류 발생");
  }
};
