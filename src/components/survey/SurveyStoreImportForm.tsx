"use client";

import { useActionState } from "react";
import { importSurveyStores, type SurveyActionState } from "@/app/survey-actions";

const initialState: SurveyActionState = {
  message: "",
  success: false,
};

export function SurveyStoreImportForm() {
  const [state, action, pending] = useActionState(importSurveyStores, initialState);

  function downloadResult() {
    if (!state.resultCsv) {
      return;
    }
    const blob = new Blob([`\uFEFF${state.resultCsv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "survey-store-import-result.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">门店基础资料导入</h2>
          <p className="mt-1 text-sm text-ink/62">支持从 Excel 复制表格后粘贴，或粘贴 CSV 内容。单行错误不影响其他正确行。</p>
        </div>
        <a
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-paper px-4 py-2 text-sm font-medium text-ink"
          href="/api/survey/store-template"
        >
          下载 Excel 可打开模板
        </a>
      </div>
      <form action={action} className="mt-4">
        <textarea
          className="min-h-44 w-full rounded-md border border-ink/12 bg-paper p-3 text-sm outline-none focus:border-moss"
          name="storeImportText"
          placeholder="从 Excel 复制包含表头的数据后粘贴到这里"
        />
        <button
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "预检查中" : "预检查并导入正确行"}
        </button>
      </form>
      {state.message ? (
        <div className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
          <p>{state.message}</p>
          {state.resultCsv ? (
            <button className="mt-2 font-medium underline" onClick={downloadResult} type="button">
              下载导入结果
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
