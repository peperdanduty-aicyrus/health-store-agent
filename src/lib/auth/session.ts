import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDataStore } from "../data/repository";
import type { Profile } from "../data/types";

export const sessionCookieName = "hsa_session";

export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;

  if (!userId) {
    return null;
  }

  const store = await getDataStore();
  return store.getUserById(userId);
}

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "user" || profile.disabled) {
    redirect("/login");
  }

  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/cyrus");
  }

  return profile;
}
