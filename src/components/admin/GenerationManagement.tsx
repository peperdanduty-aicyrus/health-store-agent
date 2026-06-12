import Link from "next/link";
import type { GenerationRecord } from "@/lib/data/types";

export function GenerationManagement({ generations }: { generations: GenerationRecord[] }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">生成记录</h2>
      <div className="mt-5 grid gap-4">
        {generations.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">暂无生成记录。</p>
        ) : (
          generations.map((record) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={record.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{record.storeName}</p>
                <p className="text-xs text-ink/50">{new Date(record.createdAt).toLocaleString("zh-CN")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {record.phone} / {record.generationType} / {record.projectName} / {record.modelProvider}:{record.modelName}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm leading-6 text-ink/62">复制：{record.copied ? "是" : "否"}；备注：{record.userNote || "无"}</p>
                <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium text-ink" href={`/cyrus/generations/${record.id}`}>
                  查看详情
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
