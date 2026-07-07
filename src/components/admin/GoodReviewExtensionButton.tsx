"use client";

import { useActionState } from "react";
import { extendCustomerForGoodReview, type CreateMerchantFormState } from "@/app/actions";

const initialState: CreateMerchantFormState = { message: "", success: false };

export function GoodReviewExtensionButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(extendCustomerForGoodReview, initialState);

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input name="userId" type="hidden" value={userId} />
      <button className="font-medium text-coral disabled:opacity-50" disabled={pending} type="submit">
        {pending ? "延期中" : "延长1个月"}
      </button>
      {state.message ? <span className={`max-w-40 text-xs ${state.success ? "text-moss" : "text-coral"}`}>{state.message}</span> : null}
    </form>
  );
}
