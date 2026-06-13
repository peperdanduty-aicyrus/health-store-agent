import type { Metadata } from "next";
import { WorkbenchLoginForm } from "@/components/workbench/WorkbenchLoginForm";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { WorkbenchToolGrid } from "@/components/workbench/WorkbenchToolGrid";
import { getCurrentWorkbenchAccount } from "@/lib/auth/workbench-session";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "雷鸣磊副业运营工作台",
};

export default async function WorkbenchPage() {
  const account = await getCurrentWorkbenchAccount();

  if (!account) {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-md">
          <WorkbenchLoginForm />
        </div>
      </main>
    );
  }

  return (
    <WorkbenchShell account={account}>
      <section className="mb-5 rounded-lg border border-ink/10 bg-white p-5">
        <p className="text-sm font-semibold text-coral">私用工具</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">今天要生成什么内容？</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          用于生成小饭盒系列视频脚本、代运营宣传文案、朋友圈长期宣传文案、海报文案和 AI 作图提示词。
        </p>
      </section>
      <WorkbenchToolGrid />
    </WorkbenchShell>
  );
}
