import { Field, Float, InputType, Int, ObjectType } from "type-graphql";

@InputType("VaultDetailsInput")
export class VaultDetailsInput {
  @Field()
  short_name: string;
}

@ObjectType("Grape")
export class Grape {
  @Field()
  name: string;

  @Field(() => Float)
  percentage: number;
}

@ObjectType("VaultDetail")
export class VaultDetail {
  @Field({ nullable: true })
  vintage?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  country_kr?: string;

  @Field({ nullable: true })
  region1?: string;

  @Field({ nullable: true })
  region2?: string;

  @Field({ nullable: true })
  winery?: string;

  @Field({ nullable: true })
  abv?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  type_kr?: string;

  @Field(() => Float, { defaultValue: 0 })
  body?: number;

  @Field(() => Float, { defaultValue: 0 })
  sweetness?: number;

  @Field(() => Float, { defaultValue: 0 })
  acidity?: number;

  @Field(() => Float, { defaultValue: 0 })
  tannin?: number;

  @Field(() => [Grape], { defaultValue: [] })
  grapes?: Grape[];

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  description_kr?: string;

  @Field({ nullable: true })
  lwin?: string;
}

@ObjectType("VaultDetailsOutput")
export class VaultDetailsOutput {
  @Field(() => Int)
  lowest_price: number;

  @Field(() => Int)
  highest_price: number;

  @Field()
  short_name: string;

  @Field()
  img_url: string;

  @Field(() => [VaultDetail], { defaultValue: [] })
  details: VaultDetail[];
}
