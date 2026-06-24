type StoreSearchInput = {
  aliases: string[];
  brandName: string;
  storeName: string;
};

const strippedCharacters = /[\s\\\/／.,，。·\-_\u2010-\u2015&＆'’"“”()（）[\]【】{}<>《》:：;；|+]+/g;

export function normalizeStoreSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(strippedCharacters, "");
}

export function buildStoreSearchText(input: StoreSearchInput): string {
  const parts = [input.brandName, input.storeName, ...input.aliases]
    .map(normalizeStoreSearchText)
    .filter(Boolean);
  return Array.from(new Set(parts)).join(" ");
}
