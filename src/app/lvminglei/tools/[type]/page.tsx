import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkbenchGenerationForm } from "@/components/workbench/WorkbenchGenerationForm";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { requireWorkbenchAccount } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchFieldDefinitions, workbenchToolDefinitions } from "@/lib/domain/workbench";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "内容生成｜吕明磊副业运营工作台",
};

export default async function WorkbenchToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const account = await requireWorkbenchAccount();
  const { type } = await params;

  if (!Object.keys(workbenchToolDefinitions).includes(type)) {
    notFound();
  }

  const toolType = type as WorkbenchGenerationType;
  const { from } = await searchParams;
  const initialValues = from ? await loadInitialValues(from, account.id, account.role === "owner") : {};

  return (
    <WorkbenchShell account={account}>
      <Link className="text-sm font-medium text-moss" href="/lvminglei">
        返回工作台
      </Link>
      <section className="mt-5">
        <p className="text-sm font-semibold text-coral">内容生成</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">{workbenchToolDefinitions[toolType].label}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">{workbenchToolDefinitions[toolType].description}</p>
      </section>
      <div className="mt-5">
        <WorkbenchGenerationForm fields={workbenchFieldDefinitions[toolType]} initialValues={initialValues} type={toolType} />
      </div>
    </WorkbenchShell>
  );
}

async function loadInitialValues(recordId: string, accountId: string, canReadAll: boolean): Promise<Record<string, string>> {
  const record = await (await getDataStore()).getWorkbenchGenerationById(recordId);
  if (!record || (!canReadAll && record.accountId !== accountId)) {
    return {};
  }

  try {
    return JSON.parse(record.input) as Record<string, string>;
  } catch {
    return {};
  }
}
