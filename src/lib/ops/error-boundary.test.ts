import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("safe Chinese error boundaries", () => {
  it("shows a useful message without rendering internal diagnostics", () => {
    for (const file of ["src/app/error.tsx", "src/app/global-error.tsx"]) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).toContain("请刷新后重试");
      expect(source).not.toContain("error.message");
      expect(source).not.toContain("error.stack");
      expect(source).not.toContain("digest}");
    }
  });
});
