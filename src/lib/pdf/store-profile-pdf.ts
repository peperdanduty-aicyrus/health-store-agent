export const storeProfilePdfMaxBytes = 2 * 1024 * 1024;
export const extractedTextLimit = 12000;
export const extractedTextPreviewLimit = 2000;

const invalidPdfMessage = "目前仅支持上传 PDF 文件。";
const oversizedPdfMessage = "文件过大，请上传 2MB 以内的 PDF 资料。";
export const unreadablePdfMessage = "当前文件可能是扫描件或图片版 PDF，暂时无法识别，请上传文字版 PDF。";

export type PdfUploadMeta = {
  name: string;
  size: number;
  type: string;
};

export function validatePdfUpload(file: PdfUploadMeta): string {
  const fileName = file.name.toLowerCase();
  if (file.type !== "application/pdf" && !fileName.endsWith(".pdf")) {
    return invalidPdfMessage;
  }
  if (file.size > storeProfilePdfMaxBytes) {
    return oversizedPdfMessage;
  }
  return "";
}

export async function extractPdfTextFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const binary = bytesToBinaryString(bytes);
  if (!binary.startsWith("%PDF")) {
    throw new Error(invalidPdfMessage);
  }

  const streamTexts: string[] = [];
  const streamPattern = /<<(.*?)>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  for (const match of binary.matchAll(streamPattern)) {
    const dictionary = match[1] ?? "";
    const stream = match[2] ?? "";
    const streamBytes = binaryStringToBytes(stream);
    const content = dictionary.includes("FlateDecode")
      ? await inflateStreamToText(streamBytes)
      : bytesToBinaryString(streamBytes);
    streamTexts.push(extractTextOperators(content));
  }

  const text = normalizeExtractedText(streamTexts.join("\n"));
  if (text.length < 10) {
    throw new Error(unreadablePdfMessage);
  }
  return text;
}

export function trimExtractedTextForSummary(text: string): string {
  return normalizeExtractedText(text).slice(0, extractedTextLimit);
}

export function getExtractedTextPreview(text: string): string {
  return normalizeExtractedText(text).slice(0, extractedTextPreviewLimit);
}

export function getVirtualPdfPath(userId: string, fileName: string): string {
  return `d1://store_profiles/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
}

async function inflateStreamToText(bytes: Uint8Array): Promise<string> {
  try {
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate"));
    const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytesToBinaryString(inflated);
  } catch {
    return "";
  }
}

function extractTextOperators(content: string): string {
  const results: string[] = [];

  const literalPattern = /\((?:\\.|[^\\()])*\)/g;
  for (const match of content.matchAll(literalPattern)) {
    results.push(decodePdfLiteralString(match[0].slice(1, -1)));
  }

  const hexPattern = /<([0-9A-Fa-f\s]{4,})>/g;
  for (const match of content.matchAll(hexPattern)) {
    const decoded = decodePdfHexString(match[1] ?? "");
    if (decoded) {
      results.push(decoded);
    }
  }

  return results.join(" ");
}

function decodePdfLiteralString(value: string): string {
  const unescaped = value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
  return decodeUtf8BinaryString(unescaped);
}

function decodePdfHexString(value: string): string {
  const hex = value.replace(/\s/g, "");
  if (hex.length < 4 || hex.length % 2 !== 0) {
    return "";
  }
  const bytes: number[] = [];
  for (let index = 0; index < hex.length; index += 2) {
    bytes.push(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) + bytes[index + 1]);
    }
    return output;
  }
  return bytesToBinaryString(new Uint8Array(bytes));
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeUtf8BinaryString(value: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(binaryStringToBytes(value));
  } catch {
    return value;
  }
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let output = "";
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    output += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return output;
}

function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}
