import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent route isolation build wiring", () => {
  it("places middleware beside the src app so Next includes it in the Worker build", () => {
    expect(existsSync("src/middleware.ts")).toBe(true);
    expect(existsSync("middleware.ts")).toBe(false);
  });
});
