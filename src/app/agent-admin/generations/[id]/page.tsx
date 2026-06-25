import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import { getPlanConfig } from "@/lib/domain/plans";
import { sceneDefinitions } from "@/lib/domain/scenes";

export default async function AdminGenerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const store = await getDataStore();
  const record = await store.getGenerationById(id);

  if (!record) {
    notFound();
  }

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
        <Info label="备注" value={record.userNote || "无"} />
        <Info label="补充信息" value={record.extraInfo || "无"} />
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">自动敏感词处理</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/72">{record.sensitiveCheckResult}</p>
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">客户看到的生成结果</p>
        <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-paper p-4 text-sm leading-7 text-ink/75">{record.result}</pre>
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">提示词记录</p>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-4 text-xs leading-6 text-ink/62">{record.prompt}</pre>
      </section>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-ink">{value}</p>
    </div>
  );
}
