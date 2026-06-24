"use client";

import { useEffect } from "react";

export function ClearSurveyDraft({ draftKey }: { draftKey: string }) {
  useEffect(() => {
    window.localStorage.removeItem(draftKey);
  }, [draftKey]);

  return null;
}
