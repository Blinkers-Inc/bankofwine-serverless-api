import axios from "axios";

const TEST_URL =
  "https://hooks.slack.com/services/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";

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
        title: `message : ${
          message ? JSON.stringify(message).slice(0, 255) : "none"
        }`,
        short: false,
      },
      {
        title: `data: ${data ? JSON.stringify(data) : "none"}`,
        short: false,
      },
    ],
  };

  try {
    await axios.post(TEST_URL, slackMessage);
    console.log("슬랙 전송 완료");
  } catch (err) {
    console.log("슬랙 전송 중 오류 발생");
  }
};
