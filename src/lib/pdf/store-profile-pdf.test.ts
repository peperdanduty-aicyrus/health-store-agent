import { describe, expect, it } from "vitest";
import {
  extractPdfTextFromBuffer,
  validatePdfUpload,
  trimExtractedTextForSummary,
} from "./store-profile-pdf";

describe("store profile PDF helpers", () => {
  it("rejects unsupported file types and oversized files", () => {
    expect(validatePdfUpload({ name: "empty.pdf", size: 0, type: "application/pdf" })).toBe(
      "文件内容为空，请上传文字版 PDF。",
    );
    expect(validatePdfUpload({ name: "intro.docx", size: 1000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).toBe(
      "目前仅支持上传 PDF 文件。",
    );
    expect(validatePdfUpload({ name: "intro.pdf", size: 2 * 1024 * 1024 + 1, type: "application/pdf" })).toBe(
      "文件过大，请上传 2MB 以内的 PDF 资料。",
    );
  });

  it("extracts plain text from a simple text PDF stream", async () => {
    const pdf = [
      "%PDF-1.4",
      "1 0 obj << /Length 72 >> stream",
      "BT /F1 12 Tf 72 720 Td (春和中医馆) Tj (肩颈调理 艾灸 服务流程) Tj ET",
      "endstream endobj",
      "%%EOF",
    ].join("\n");

    await expect(extractPdfTextFromBuffer(new TextEncoder().encode(pdf).buffer)).resolves.toContain("春和中医馆");
  });

  it("reports image-only or unreadable PDFs with the expected message", async () => {
    const pdf = "%PDF-1.4\n1 0 obj << /Length 0 >> stream\nendstream endobj\n%%EOF";

    await expect(extractPdfTextFromBuffer(new TextEncoder().encode(pdf).buffer)).rejects.toThrow(
      "当前 PDF 无法识别，可能是扫描件、图片版、加密文件或文件内容为空，请上传文字版 PDF。",
    );
  });

  it("limits extracted text before summary generation", () => {
    const longText = "门店介绍".repeat(3000);

    expect(trimExtractedTextForSummary(longText)).toHaveLength(12000);
  });
});
