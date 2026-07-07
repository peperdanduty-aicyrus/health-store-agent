import { describe, expect, it } from "vitest";
import { formatChinaDateTime } from "./date-format";

describe("stable China date formatting", () => {
  it("uses a fixed timezone so server and browser render the same text", () => {
    expect(formatChinaDateTime("2026-07-05T02:00:00.000Z")).toBe("2026/07/05 10:00:00");
  });
});
