import { FieldResolver, Resolver, Root } from "type-graphql";
import { Service } from "typedi";

import { prismaClient } from "src/lib/prisma";
import { Nft_con_edition } from "src/prisma";
import { VaultRelatedEdition } from "src/resolvers/vault/dto/vault-raw-related-editions.dto";

@Service()
@Resolver(VaultRelatedEdition)
export class VaultRelatedEditionFieldResolver {
  @FieldResolver(() => Nft_con_edition)
  async nft_con_edition(
    @Root() { nft_con_edition_uuid }: VaultRelatedEdition
  ): Promise<Nft_con_edition> {
    return prismaClient.nft_con_edition.findUniqueOrThrow({
      where: { uuid: nft_con_edition_uuid },
    });
  }
}
