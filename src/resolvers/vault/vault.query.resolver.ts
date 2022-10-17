import { Arg, Ctx, Directive, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

import { IContext } from "src/common/interfaces/context";
import { Nft_con_info } from "src/prisma";
import {
  VaultListInput,
  VaultListOutput,
  VaultListSort,
} from "src/resolvers/vault/dto/vault-list.dto";

@Service()
@Resolver(Nft_con_info)
export class VaultQueryResolver {
  @Query(() => VaultListOutput, { defaultValue: [] })
  @Directive("@cacheControl(maxAge:100)")
  async vault_list(
    @Arg("input") { sort, skip = 0, take = 24 }: VaultListInput,
    @Ctx() { prismaClient }: IContext
  ): Promise<VaultListOutput> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any = {};

    switch (sort) {
      case VaultListSort.ALPHABETICAL_ASC:
        args.orderBy = {
          short_name: "asc",
        };
        break;

      case VaultListSort.ALPHABETICAL_DESC:
        args.orderBy = {
          short_name: "desc",
        };
        break;

      default:
        args.orderBy = {
          short_name: "asc",
        };
        break;
    }

    const result = await prismaClient.nft_con_info.findMany(args);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduced: any[] = result.reduce((pre: any, cur: any) => {
      if (!pre.length) {
        pre.push(cur);
        return pre;
      }

      if (pre[pre.length - 1].short_name === cur.short_name) {
        if (pre[pre.length - 1].vintage === "-") {
          return pre;
        }

        if (Number(cur.vintage) > Number(pre[pre.length - 1].vintage)) {
          return pre;
        }

        //todo: 이름 같을 경우 edition 말고 normal 이미지 사용해야함 (vintage 관계없이)

        const sliced = pre.slice(0, -1);
        pre.push(cur);
        return [...sliced, cur];
      }

      pre.push(cur);
      return pre;
    }, []);

    take = take ?? reduced.length;

    return {
      list: reduced.slice(skip, take + skip),
      totalCount: reduced.length,
    };
  }
}
