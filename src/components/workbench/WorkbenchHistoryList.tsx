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
                <p className="font-semibold text-ink">功能类型：{workbenchToolDefinitions[record.generationType].label}</p>
                <HistoryMeta account={account} record={record} />
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

function HistoryMeta({ account, record }: { account: WorkbenchAccount; record: WorkbenchGenerationRecord }) {
  const input = parseInput(record.input);
  const items = [
    ["使用场景", input.usageScene],
    ["发布平台", input.publishPlatform || input.targetPlatform],
    ["价格露出方式", input.priceExposure],
    ["生成时间", new Date(record.createdAt).toLocaleString("zh-CN")],
    ["使用模型", `${record.modelProvider}:${record.modelName}`],
    account.role === "owner" ? ["账号", record.accountDisplayName] : null,
  ].filter(Boolean) as string[][];

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <span className="rounded-md border border-ink/10 bg-paper px-2.5 py-1 text-xs text-ink/58" key={label}>
          {label}：{value}
        </span>
      ))}
    </div>
  );
}

function formatInput(input: string): string {
  const parsed = parseInput(input);
  if (Object.keys(parsed).length > 0) {
    return Object.entries(parsed)
      .filter(([, value]) => value)
      .map(([key, value]) => `${inputLabelFor(key)}：${value}`)
      .join("\n");
  }
  return input;
}

function parseInput(input: string): Record<string, string> {
  try {
    return JSON.parse(input) as Record<string, string>;
  } catch {
    return {};
  }
}

function inputLabelFor(key: string): string {
  const labels: Record<string, string> = {
    contentStyle: "内容风格",
    corePain: "核心痛点",
    customerPain: "客户痛点",
    designStyle: "设计风格",
    extraInfo: "补充信息",
    mainContent: "主推内容",
    mealDescription: "今日饭菜描述",
    posterCategory: "海报类别",
    priceExposure: "价格露出方式",
    product: "推广产品",
    publishGoal: "发布目的",
    publishPlatform: "发布平台",
    storeIssue: "店铺主要问题",
    storeType: "店铺行业",
    targetCustomer: "目标客户",
    targetPlatform: "检查平台",
    topic: "宣传主题",
    usageScene: "使用场景",
  };

  return labels[key] ?? key;
}
