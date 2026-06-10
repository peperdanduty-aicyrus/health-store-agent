import type { GenerationRecord } from "@/lib/data/types";

export function HistoryList({ records }: { records: GenerationRecord[] }) {
  if (records.length === 0) {
    return <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">还没有生成记录。</p>;
  }

  return (
    <div className="grid gap-4">
      {records.map((record) => (
        <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={record.id}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-ink">{record.projectName}</p>
            <p className="text-xs text-ink/50">{new Date(record.createdAt).toLocaleString("zh-CN")}</p>
          </div>
          <p className="mt-2 text-sm text-ink/62">
            {record.generationType} / {record.purpose} / {record.modelProvider}:{record.modelName}
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-3 text-sm leading-6 text-ink/72">{record.result}</pre>
        </article>
      ))}
    </div>
  );
}

