import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { MemberUidInput } from "src/common/dto/uuid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { My_nft_con } from "src/prisma";
import { TokenOwnerAddressInput } from "src/resolvers/databases/my-nft-con/dto/token-owner-address.dto";

@Service()
@Resolver(My_nft_con)
export class MyNftConQueryResolver {
  @Query(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_con(
    @Arg("input") { uuid }: UuidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con> {
    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: { uuid },
    });
  }

  @Query(() => [My_nft_con], { defaultValue: [] })
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_cons(
    @Arg("input") { member_uid }: MemberUidInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<My_nft_con[]> {
    return prismaClient.my_nft_con.findMany({
      where: { member_uid },
    });
  }

  @Query(() => String, { nullable: true })
  async token_owner_address(
    @Arg("input")
    {
      token_id,
      contract_address = process.env.PRE_NFT_CONTRACT_ADDRESS,
    }: TokenOwnerAddressInput,
    @Ctx() { caver }: IContext
  ): Promise<string | null> {
    if (!token_id) return null;

    const instance = new caver.klay.Contract(ERC721_ABI, contract_address);
    const convertTokenId = caver.utils.toBN(token_id).toString();

    try {
      return await instance.methods.ownerOf(Number(convertTokenId)).call();
    } catch {
      return null;
    }
  }
}
