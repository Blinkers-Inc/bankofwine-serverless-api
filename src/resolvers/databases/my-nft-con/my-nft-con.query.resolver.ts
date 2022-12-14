import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { ERC721_ABI } from "src/abi/ERC721";
import { MemberUidInput } from "src/common/dto/uuid.input";
import { UuidInput } from "src/common/dto/uuid.input";
import { IContext } from "src/common/interfaces/context";
import { prismaClient } from "src/lib/prisma";
import { My_nft_con } from "src/prisma";
import { TokenOwnerAddressInput } from "src/resolvers/databases/my-nft-con/dto/query/token-owner-address.dto";

@Service()
@Resolver(My_nft_con)
export class MyNftConQueryResolver {
  @Query(() => My_nft_con)
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_con(@Arg("input") { uuid }: UuidInput): Promise<My_nft_con> {
    return prismaClient.my_nft_con.findUniqueOrThrow({
      where: { uuid },
      include: {
        nft_con_edition: true,
      },
    });
  }

  @Query(() => [My_nft_con], { defaultValue: [] })
  @Directive("@cacheControl(maxAge:0)")
  async my_nft_cons(
    @Arg("input") { member_uid }: MemberUidInput
  ): Promise<My_nft_con[]> {
    return prismaClient.my_nft_con.findMany({
      orderBy: {
        created_at: "desc",
      },
      where: {
        is_active: true,
        member_uid,
      },
      include: {
        nft_con_edition: true,
      },
    });
  }

  @Query(() => String, { nullable: true })
  async token_owner_address(
    @Arg("input")
    { token_id, contract_address }: TokenOwnerAddressInput,
    @Ctx() { caver }: IContext
  ): Promise<string | null> {
    if (!token_id) return null;

    const contractAddress =
      contract_address ?? process.env.PRE_NFT_CONTRACT_ADDRESS;
    const instance = new caver.klay.Contract(ERC721_ABI, contractAddress);
    const convertTokenId = caver.utils.toBN(token_id).toString();

    try {
      return await instance.methods.ownerOf(Number(convertTokenId)).call();
    } catch {
      return null;
    }
  }
}
