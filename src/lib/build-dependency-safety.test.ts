import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const OPENNEXT_VERSION = "1.19.11";

describe("agent Cloudflare build dependency safety", () => {
  it("pins OpenNext Cloudflare exactly in package manifests", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));

    expect(packageJson.dependencies["@opennextjs/cloudflare"]).toBe(OPENNEXT_VERSION);
    expect(packageLock.packages[""].dependencies["@opennextjs/cloudflare"]).toBe(OPENNEXT_VERSION);
    expect(packageLock.packages["node_modules/@opennextjs/cloudflare"].version).toBe(OPENNEXT_VERSION);
  });
});
