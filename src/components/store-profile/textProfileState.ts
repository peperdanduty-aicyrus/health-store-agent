"use client";

import type { StoreProfileActionState } from "@/app/actions";

export function getVisibleActionStates(states: Array<StoreProfileActionState | undefined | null>) {
  return states.filter((state): state is StoreProfileActionState => Boolean(state?.message));
}
