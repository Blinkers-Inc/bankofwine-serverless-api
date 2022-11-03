import { PrismaClient } from "@prisma/client";
import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IContext {
  @Field(() => PrismaClient, { name: "prismaClient" })
  prismaClient: PrismaClient;

  @Field(() => JSON, { name: "caver" })
  caver: any;

  @Field({ defaultValue: "", name: "Authorization" })
  Authorization: string;

  @Field({ defaultValue: "", name: "uid" })
  uid: string;
}
