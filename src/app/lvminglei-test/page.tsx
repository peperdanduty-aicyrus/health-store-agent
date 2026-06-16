import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkbenchToolGrid } from "@/components/workbench/WorkbenchToolGrid";
import { isWorkbenchPublicTestEnabled } from "@/lib/workbench/public-test";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "临时测试页｜吕明磊副业运营工作台",
};

export default function WorkbenchPublicTestPage() {
  if (!isWorkbenchPublicTestEnabled()) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="mb-5 rounded-lg border border-coral/20 bg-white p-5">
          <p className="text-sm font-semibold text-coral">临时公开测试页</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">吕明磊副业运营工作台测试入口</h1>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            这个页面不需要账号密码，方便临时测试生成效果。测试页不会保存历史记录，也不展示正式账号管理功能。
          </p>
        </section>
        <WorkbenchToolGrid basePath="/lvminglei-test" showHistory={false} />
      </div>
    </main>
  );
}
