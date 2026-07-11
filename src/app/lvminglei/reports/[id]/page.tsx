import { notFound } from "next/navigation";
import { saveOpsReport } from "@/app/lvminglei/actions";
import { CopyTextButton } from "@/components/ops/CopyTextButton";
import { Field, PageHeader, Panel } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function ReportDraftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkbenchOwner();
  const { id } = await params;
  const store = await getOpsStore();
  const report = await store.getReport(id);
  if (!report) notFound();
  const client = await store.getClient(report.clientId);
  return (
    <>
      <PageHeader title={report.reportType === "weekly" ? "每周汇报草稿" : "每月汇报草稿"} description={`${client?.clientName || "未知客户"} · ${report.periodStart} 至 ${report.periodEnd}`} />
      <Panel>
        <form action={saveOpsReport} className="ops-report-editor"><input name="id" type="hidden" value={report.id} /><Field label="草稿状态"><select name="status" defaultValue={report.status}><option>草稿</option><option>已确认</option></select></Field><Field wide label="汇报内容"><textarea name="content" rows={28} defaultValue={report.content} /></Field><div className="ops-report-actions"><button className="ops-button ops-button-primary" type="submit">保存草稿</button><CopyTextButton text={report.content} /></div></form>
      </Panel>
    </>
  );
}
