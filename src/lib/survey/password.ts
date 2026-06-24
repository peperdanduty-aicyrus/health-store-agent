const encoder = new TextEncoder();
const iterations = 120000;
const keyLengthBits = 256;

export async function hashSurveyPassword(password: string, salt = randomSalt()): Promise<string> {
  const hash = await pbkdf2(password, salt);
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export async function verifySurveyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, storedIterations, salt, expected] = storedHash.split("$");
  if (scheme !== "pbkdf2_sha256" || storedIterations !== String(iterations) || !salt || !expected) {
    return false;
  }

  const actual = await pbkdf2(password, salt);
  return timingSafeEqual(actual, expected);
}

async function pbkdf2(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations,
      name: "PBKDF2",
      salt: encoder.encode(salt),
    },
    key,
    keyLengthBits,
  );
  return base64UrlEncode(new Uint8Array(bits));
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
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
