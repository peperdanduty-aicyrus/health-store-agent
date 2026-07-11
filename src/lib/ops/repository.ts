import { assertAgentMode } from "@/lib/app-mode";
import type { D1DatabaseLike } from "@/lib/data/store-d1";
import { createD1OpsStore } from "./store-d1";
import { memoryOpsStore, type OpsStore } from "./store";

let d1OpsStorePromise: Promise<OpsStore> | null = null;

export async function getOpsStore(): Promise<OpsStore> {
  assertAgentMode();
  if (process.env.OPS_USE_MEMORY === "1") return memoryOpsStore;
  const db = await getD1Database();
  if (!db) return memoryOpsStore;
  d1OpsStorePromise ??= Promise.resolve(createD1OpsStore(db));
  return d1OpsStorePromise;
}

async function getD1Database(): Promise<D1DatabaseLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const env = context.env as CloudflareEnv & { DB?: D1DatabaseLike };
    return env.DB ?? null;
  } catch {
    return null;
  }
}
