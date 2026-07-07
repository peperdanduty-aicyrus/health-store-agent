import type { GenerationRecord } from "@/lib/data/types";
import { formatChinaDateTime } from "@/lib/date-format";
import { sceneDefinitions } from "@/lib/domain/scenes";
import { getGenerationRecordPresentation } from "@/lib/ai/generation-record";
import { StructuredGenerationResult } from "./StructuredGenerationResult";

export function HistoryList({ records }: { records: GenerationRecord[] }) {
  if (records.length === 0) {
    return <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">还没有生成记录。</p>;
  }

  return (
    <div className="grid gap-4">
      {records.map((record) => {
        const presentation = getGenerationRecordPresentation(record);
        return (
          <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={record.id}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-ink">{record.projectName}</p>
              <p className="text-xs text-ink/50">{formatChinaDateTime(record.createdAt)}</p>
            </div>
            <p className="mt-2 text-sm text-ink/62">
              {sceneDefinitions[record.generationType].label} / {record.purpose} / 店铺资料：
              {record.usedStoreProfile ? "是" : "否"} / {record.modelProvider}:{record.modelName} / 状态：
              {statusLabel(presentation.status)}
            </p>
            {presentation.displayable ? (
              <StructuredGenerationResult
                content={presentation.cleanedContent}
                embedded
                generationId={record.id}
                scene={record.generationType}
              />
            ) : (
              <p className="mt-3 rounded-md bg-paper p-3 text-sm text-ink/62">{presentation.message}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function statusLabel(status: GenerationRecord["status"]): string {
  if (status === "success") {
    return "成功";
  }
  if (status === "failed") {
    return "失败";
  }
  return "旧记录";
}
