"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteWorkbenchGeneration } from "@/app/lvminglei/actions";
import type { WorkbenchAccount, WorkbenchGenerationRecord, WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchToolDefinitions, workbenchToolTypes } from "@/lib/domain/workbench";
import { WorkbenchStructuredResult } from "./WorkbenchStructuredResult";

export function WorkbenchHistoryList({
  account,
  records,
}: {
  account: WorkbenchAccount;
  records: WorkbenchGenerationRecord[];
}) {
  const [filter, setFilter] = useState<WorkbenchGenerationType | "all">("all");
  const filtered = useMemo(
    () => records.filter((record) => filter === "all" || record.generationType === filter),
    [filter, records],
  );

  if (records.length === 0) {
    return <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">还没有生成记录。</p>;
  }

  return (
    <div>
      <label className="mb-4 block max-w-xs text-sm font-medium text-ink/75">
        按功能筛选
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-white px-3 outline-none focus:border-moss"
          onChange={(event) => setFilter(event.target.value as WorkbenchGenerationType | "all")}
          value={filter}
        >
          <option value="all">全部功能</option>
          {workbenchToolTypes.map((type) => (
            <option key={type} value={type}>
              {workbenchToolDefinitions[type].label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4">
        {filtered.map((record) => (
          <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={record.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{workbenchToolDefinitions[record.generationType].label}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {new Date(record.createdAt).toLocaleString("zh-CN")} / {record.modelProvider}:{record.modelName}
                  {account.role === "owner" ? ` / ${record.accountDisplayName}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex min-h-9 items-center rounded-md border border-ink/10 bg-paper px-3 py-1.5 text-sm font-medium text-ink"
                  href={`/lvminglei/tools/${record.generationType}?from=${record.id}`}
                >
                  重新生成
                </Link>
                <form action={deleteWorkbenchGeneration}>
                  <input name="generationId" type="hidden" value={record.id} />
                  <button className="inline-flex min-h-9 items-center rounded-md border border-coral/20 bg-coral/10 px-3 py-1.5 text-sm font-medium text-coral" type="submit">
                    删除
                  </button>
                </form>
              </div>
            </div>
            <details className="mt-4 rounded-md border border-ink/10 bg-paper p-3 text-sm text-ink/72">
              <summary className="cursor-pointer font-medium text-ink">查看输入内容</summary>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6">{formatInput(record.input)}</pre>
            </details>
            <WorkbenchStructuredResult content={record.output} generationId={record.id} />
          </article>
        ))}
      </div>
    </div>
  );
}

function formatInput(input: string): string {
  try {
    const parsed = JSON.parse(input) as Record<string, string>;
    return Object.entries(parsed)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}：${value}`)
      .join("\n");
  } catch {
    return input;
  }
}
