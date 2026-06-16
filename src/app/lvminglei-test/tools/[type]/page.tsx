import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateWorkbenchTest } from "@/app/lvminglei-test/actions";
import { WorkbenchGenerationForm } from "@/components/workbench/WorkbenchGenerationForm";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchFieldDefinitions, workbenchToolDefinitions } from "@/lib/domain/workbench";
import { isWorkbenchPublicTestEnabled } from "@/lib/workbench/public-test";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "公开测试生成｜吕明磊副业运营工作台",
};

export default async function WorkbenchPublicTestToolPage({ params }: { params: Promise<{ type: string }> }) {
  if (!isWorkbenchPublicTestEnabled()) {
    notFound();
  }

  const { type } = await params;

  if (!Object.keys(workbenchToolDefinitions).includes(type)) {
    notFound();
  }

  const toolType = type as WorkbenchGenerationType;

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link className="text-sm font-medium text-moss" href="/lvminglei-test">
          返回测试入口
        </Link>
        <section className="mt-5 rounded-lg border border-coral/20 bg-white p-5">
          <p className="text-sm font-semibold text-coral">临时公开测试</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{workbenchToolDefinitions[toolType].label}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/62">{workbenchToolDefinitions[toolType].description}</p>
          <p className="mt-2 text-xs leading-5 text-ink/50">无需登录。生成结果不保存到历史记录，复制状态也不会写入正式账号。</p>
        </section>
        <div className="mt-5">
          <WorkbenchGenerationForm actionOverride={generateWorkbenchTest} fields={workbenchFieldDefinitions[toolType]} type={toolType} />
        </div>
      </div>
    </main>
  );
}
