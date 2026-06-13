import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDataStore } from "../data/repository";
import type { WorkbenchAccount } from "../data/types";

export const workbenchSessionCookieName = "hsa_workbench_session";

export async function getCurrentWorkbenchAccount(): Promise<WorkbenchAccount | null> {
  const cookieStore = await cookies();
  const accountId = cookieStore.get(workbenchSessionCookieName)?.value;

  if (!accountId) {
    return null;
  }

  const store = await getDataStore();
  const account = await store.getWorkbenchAccountById(accountId);
  return account && !account.disabled ? account : null;
}

export async function requireWorkbenchAccount(): Promise<WorkbenchAccount> {
  const account = await getCurrentWorkbenchAccount();

  if (!account) {
    redirect("/lvminglei");
  }

  return account;
}

export async function requireWorkbenchOwner(): Promise<WorkbenchAccount> {
  const account = await requireWorkbenchAccount();

  if (account.role !== "owner") {
    redirect("/lvminglei");
  }

  return account;
}
