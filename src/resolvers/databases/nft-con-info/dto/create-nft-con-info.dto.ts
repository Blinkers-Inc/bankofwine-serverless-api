import { Field, InputType, Int, registerEnumType } from "type-graphql";

import { Tier } from "src/resolvers/vault/dto/vault-raw-related-editions.dto";

export enum TypeEn {
  DESSERT = "Dessert",
  RED = "Red",
  SPARKLING = "Sparkling",
  WHITE = "White",
}

export enum TypeKo {
  DESSERT = "디저트",
  RED = "레드",
  SPARKLING = "스파클링",
  WHITE = "화이트",
}

registerEnumType(TypeEn, {
  name: "TypeEn",
});

registerEnumType(TypeKo, {
  name: "TypeKo",
});

@InputType("CreateNftConInfoInput", {
  description: "nft_con_info 생성 인풋 (어드민)",
})
export class CreateNftConInfoInput {
  @Field()
  uuid!: string;

  @Field()
  name!: string;

  @Field()
  short_name!: string;

  @Field(() => Tier)
  tier!: Tier;

  @Field(() => TypeEn)
  type_en!: TypeEn;

  @Field(() => TypeKo)
  type_ko!: TypeKo;

  @Field()
  abv!: string;

  @Field()
  capacity!: string;

  @Field()
  description_en!: string;

  @Field()
  description_ko!: string;

  @Field()
  vintage!: string;

  @Field()
  img_url!: string;

  @Field()
  gif_url!: string;

  @Field()
  static_frontal_img_url!: string;

  @Field()
  static_diagonal_img_url!: string;

  @Field()
  rate_of_price_fluctuation!: string;

  @Field()
  creator!: string;

  @Field({ nullable: true })
  grape_variety_en?: string;

  @Field({ nullable: true })
  grape_variety_kr?: string;

  @Field({ nullable: true })
  nft_id?: string;

  @Field({ nullable: true })
  region_en?: string;

  @Field({ nullable: true })
  region_ko?: string;

  @Field(() => Int, { nullable: true })
  sort?: number;

  @Field({ nullable: true })
  winery?: string;

  @Field(() => Boolean, { nullable: true })
  is_buyable?: boolean;

  @Field({ nullable: true })
  gif_bg_color?: string;
}
