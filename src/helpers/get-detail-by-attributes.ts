import { countries, types } from "src/common/constant";
import { Nft_con_metadata, Nft_con_metadata_attribute } from "src/prisma";
import { VaultDetail } from "src/resolvers/vault/dto/vault-details.dto";

export const getVaultDetailByAttributes = (input: {
  attributes: Nft_con_metadata_attribute[];
  metadata?: Nft_con_metadata;
}): VaultDetail => {
  const { attributes, metadata } = input;

  return attributes.reduce((acc, cur: Nft_con_metadata_attribute) => {
    if (cur.trait_type === "Vintage") {
      acc.vintage = cur.string_value ?? "";
    }

    if (cur.trait_type === "Country") {
      acc.country = cur.string_value ?? "";
    }

    acc.country_kr =
      acc.country && acc.country in countries ? countries[acc.country] : "";

    if (cur.trait_type === "Region 1") {
      acc.region1 = cur.string_value ?? "";
    }

    if (cur.trait_type === "Region 2") {
      acc.region2 = cur.string_value ?? "";
    }

    if (cur.trait_type === "Winery") {
      acc.winery = cur.string_value ?? "";
    }

    if (cur.trait_type === "Type") {
      acc.type = cur.string_value ?? "";
    }

    acc.type_kr = acc.type && acc.type in types ? types[acc.type] : "";

    if (cur.trait_type === "ABV") {
      acc.abv = cur.string_value ?? "";
    }

    if (cur.display_type === "boost_percentage") {
      const grape = {
        name: cur.trait_type,
        percentage: cur.number_value ?? 0,
      };

      if (!acc.grapes) {
        acc.grapes = [grape];
      } else {
        acc.grapes.push(grape);
      }
    }

    if (cur.trait_type === "Body") {
      acc.body = cur.number_value ?? 0;
    }

    if (cur.trait_type === "Sweetness") {
      acc.sweetness = cur.number_value ?? 0;
    }

    if (cur.trait_type === "Acidity") {
      acc.acidity = cur.number_value ?? 0;
    }

    if (cur.trait_type === "Tannin") {
      acc.tannin = cur.number_value ?? 0;
    }

    if (metadata) {
      acc.description = metadata.description;
    }

    if (cur.trait_type === "Description_KR") {
      acc.description_kr = cur.string_value ?? "";
    }

    if (cur.trait_type === "LWIN") {
      acc.lwin = cur.string_value ?? "";
    }

    return acc;
  }, {} as VaultDetail);
};
