import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const OPENNEXT_VERSION = "1.19.11";

describe("agent Cloudflare build dependency safety", () => {
  it("pins OpenNext Cloudflare exactly in the pnpm manifest and lockfile", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const pnpmLock = readFileSync("pnpm-lock.yaml", "utf8");

    expect(packageJson.dependencies["@opennextjs/cloudflare"]).toBe(OPENNEXT_VERSION);
    expect(packageJson.packageManager).toBe("pnpm@11.7.0");
    expect(pnpmLock).toContain("specifier: 1.19.11");
    expect(pnpmLock).toContain("'@opennextjs/cloudflare@1.19.11':");
    expect(existsSync("package-lock.json")).toBe(false);
  });
});
