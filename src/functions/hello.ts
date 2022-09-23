import { PrismaClient } from "@prisma/client";

export const handler: AWSLambda.Handler = async (event, __, cb) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const allBanners = await prisma.banner.findMany();
  console.log("allBanners", allBanners);
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
        data: allBanners,
      },
      null,
      2
    ),
  };
};
