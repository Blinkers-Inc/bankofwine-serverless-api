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

export const sendSlackNotification = async (input: {
  address: string;
  commission: string;
  fullName: string;
  functionName: string;
  header: string;
  memberUid: string;
  nftConEditionUuid: string;
  subTotal: string;
  tier: string;
  total: string;
}) => {
  const {
    address,
    header,
    memberUid,
    tier,
    functionName,
    fullName,
    subTotal,
    commission,
    total,
    nftConEditionUuid,
  } = input;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: header,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Function Name:*\n${functionName}`,
        },
        {
          type: "mrkdwn",
          text: `*Created by:*\n<https://${
            process.env.STAGE === "prod" ? "scope" : "baobab.scope"
          }.klaytn.com/account/${address}|${memberUid}>`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Full Name:*\n${fullName}`,
        },
        {
          type: "mrkdwn",
          text: `*Tier:*\n${tier}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Sub Price :*\n${subTotal}`,
        },
        {
          type: "mrkdwn",
          text: `*Commission :*\n${commission}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Price :*\n${total}`,
        },
        {
          type: "mrkdwn",
          text: `*Link:*\n<${
            process.env.STAGE === "prod"
              ? "https://bankofwine.co"
              : "http://futureof.bankofwine.co"
          }/marketplace/${nftConEditionUuid}|마켓플레이스 페이지로 가기>`,
        },
      ],
    },
  ];

  try {
    await webhook.send({ text: header, blocks });
    console.log("슬랙 전송 완료");
  } catch (err) {
    console.log("err", err);
    console.log("슬랙 전송 중 오류 발생");
  }
};
