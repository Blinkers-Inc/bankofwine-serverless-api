import axios from "axios";

const TEST_URL =
  "https://hooks.slack.com/services/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";

export const sendCustomError = async (input: {
  code?: string;
  errorCode?: string;
  message?: string;
  path?: string | number;
}) => {
  const { code, errorCode, message, path } = input;

  const slackMessage = {
    text: `Graphql 에러 발생 : ${process.env.STAGE}`,
    attachments: [
      {
        title: `code : ${code}`,
        value: code,
        short: true,
      },
      {
        title: `errorCode : ${errorCode ? errorCode : "none"}`,
        short: true,
      },
      {
        title: `path : ${path}`,
        short: true,
      },
      {
        title: `message : ${message}`,
        short: false,
      },
    ],
  };

  try {
    await axios.post(TEST_URL, slackMessage);
    console.log("슬랙 전송 완료");
  } catch {
    console.log("슬랙 전송 중 오류가 발생하였습니다.");
  }
};
