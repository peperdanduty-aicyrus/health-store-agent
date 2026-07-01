import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StructuredGenerationResult } from "@/components/customer/StructuredGenerationResult";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import { getPlanConfig } from "@/lib/domain/plans";
import { sceneDefinitions } from "@/lib/domain/scenes";
import { getGenerationRecordPresentation } from "@/lib/ai/generation-record";

export default async function AdminGenerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const store = await getDataStore();
  const record = await store.getGenerationById(id);

  if (!record) {
    notFound();
  }

  const presentation = getGenerationRecordPresentation(record);

  return (
    <AdminShell profile={admin}>
      <div className="mb-5 flex flex-col gap-2">
        <Link className="text-sm font-medium text-moss" href="/agent-admin/generations">
          返回记录
        </Link>
        <p className="text-sm font-semibold text-coral">生成记录详情</p>
        <h2 className="text-2xl font-semibold text-ink">{record.projectName}</h2>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <Info label="状态" value={statusLabel(presentation.status)} />
        <Info label="门店" value={record.storeName} />
        <Info label="手机号" value={record.phone} />
        <Info label="功能" value={sceneDefinitions[record.generationType].label} />
        <Info label="套餐" value={getPlanConfig(record.planName).label} />
        <Info label="门店类型" value={record.storeType} />
        <Info label="目标客户" value={record.targetCustomer} />
        <Info label="宣传目的" value={record.purpose} />
        <Info label="生成时间" value={new Date(record.createdAt).toLocaleString("zh-CN")} />
        <Info label="复制状态" value={record.copied ? "已复制" : "未复制"} />
        <Info label="引用店铺资料" value={record.usedStoreProfile ? "是" : "否"} />
        <Info label="模型" value={`${record.modelProvider}:${record.modelName}`} />
        <Info label="结束原因" value={record.finishReason || "旧记录未保存"} />
        <Info label="耗时" value={record.elapsedMs === null ? "旧记录未保存" : `${record.elapsedMs} ms`} />
        <Info label="Prompt 版本" value={record.promptVersion || "legacy"} />
        <Info label="请求 ID" value={record.requestId || "旧记录未保存"} />
        <Info label="备注" value={record.userNote || "无"} />
        <Info label="补充信息" value={record.extraInfo || "无"} />
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">自动敏感词处理</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/72">{record.sensitiveCheckResult}</p>
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">最终展示内容</p>
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
      </section>

      {presentation.status === "failed" ? (
        <section className="mt-5 rounded-lg border border-coral/20 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-coral">错误信息</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/72">
            {record.errorMessage || "生成失败，未保存详细错误。"}
          </p>
          {record.errorCode ? <p className="mt-2 text-xs text-ink/50">错误码：{record.errorCode}</p> : null}
        </section>
      ) : null}

      <details className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-coral">原始模型返回（仅管理员排查）</summary>
        <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-paper p-4 text-sm leading-7 text-ink/75">
          {record.rawResponse || "旧记录没有单独保存原始模型返回。"}
        </pre>
      </details>

      <details className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-coral">提示词记录（仅管理员排查）</summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-4 text-xs leading-6 text-ink/62">
          {record.prompt}
        </pre>
      </details>
    </AdminShell>
  );
}

function statusLabel(status: "success" | "failed" | "legacy"): string {
  return status === "success" ? "成功" : status === "failed" ? "失败" : "旧记录";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-ink">{value}</p>
    </div>
  );
}
