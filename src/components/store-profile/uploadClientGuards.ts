"use client";

import type { FormEvent } from "react";
import type { StoreProfileActionState } from "@/app/actions";

const maxPdfBytes = 2 * 1024 * 1024;

export function getVisibleActionStates(states: Array<StoreProfileActionState | undefined | null>) {
  return states.filter((state): state is StoreProfileActionState => Boolean(state?.message));
}

export function validatePdfBeforeSubmit(event: FormEvent<HTMLFormElement>) {
  const form = event.currentTarget;
  const input = form.querySelector<HTMLInputElement>('input[type="file"][name="pdf"]');
  const file = input?.files?.[0];
  const message = getPdfValidationMessage(file);

  if (message) {
    event.preventDefault();
    window.alert(message);
  }
}

function getPdfValidationMessage(file: File | undefined): string {
  if (!file) {
    return "请选择要上传的 PDF 文件。";
  }
  if (file.size <= 0) {
    return "文件内容为空，请上传文字版 PDF。";
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "目前仅支持上传 PDF 文件。";
  }
  if (file.size > maxPdfBytes) {
    return "文件过大，请上传 2MB 以内的 PDF 资料。";
  }
  return "";
}
