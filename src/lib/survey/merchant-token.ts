const encoder = new TextEncoder();

export type MerchantEditToken = {
  hash: string;
  token: string;
};

export async function createMerchantEditToken(): Promise<MerchantEditToken> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = base64UrlEncode(bytes);
  return {
    hash: await hashMerchantEditToken(token),
    token,
  };
}

export async function hashMerchantEditToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return `sha256$${base64UrlEncode(new Uint8Array(digest))}`;
}

export async function verifyMerchantEditToken(token: string, hash: string): Promise<boolean> {
  const actual = await hashMerchantEditToken(token);
  return timingSafeEqual(actual, hash);
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}
