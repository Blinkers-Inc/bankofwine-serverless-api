import { PrismaClient } from "@prisma/client";
import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IContext {
  @Field(() => PrismaClient)
  prismaClient: PrismaClient;

  @Field(() => JSON)
  caver: any;

  @Field({ defaultValue: "" })
  Authorization: string;
}
