export const BOW_NICKNAME = "B.O.W";
export const MINIMUM_LISTING_PRICE = 1_000;
export const MAXIMUM_LISTING_PRICE = 1_000_000_000;
export const COMMISSION_PERCENTAGE = 0.05;

export const functionKeccak256 = {
  migrate: "0xbbf3df0c",
};
export const eventKeccak256 = {
  Migrate: "0xcfb106b7b5693a3789fe5e4fb3e0bf3be0ad69200678333d6b490d7369a2e113",
  ApprovalForAll:
    "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
  Transfer:
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
};

export const defaultValue = {
  externalUrl: "https://www.bankofwine.co/",
};

export const countries: { [key: string]: string } = {
  France: "프랑스",
  Italy: "이탈리아",
  USA: "미국",
  Chile: "칠레",
  Australia: "호주",
};

export const types: { [key: string]: string } = {
  Red: "레드",
  White: "화이트",
  Rose: "로제",
  Sparkling: "스파클링",
  Dessert: "디저트",
  Fortified: "주정강화",
};

export const NftConEditionPurchasableStatusKr: {
  [key: string]: string;
} = {
  PURCHASABLE: "구매가능",
  REDEEMED: "교환완료",
  SOLD: "판매완료",
};

export const timestamps: { [key: string]: number } = {
  THIRTY_DAYS_MILLISECONDS: 60 * 60 * 24 * 30 * 1000,
  ONE_WEEK_MILLISECONDS: 60 * 60 * 24 * 7 * 1000,
  ONE_DAY_MILLISECONDS: 60 * 60 * 24 * 1000,
};
