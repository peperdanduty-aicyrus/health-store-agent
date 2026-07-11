import { notFound } from "next/navigation";
import { saveOpsContentProfile, saveOpsOrganization, setOpsOrganizationActive } from "@/app/lvminglei/actions";
import { Field, PageHeader, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkbenchOwner();
  const { id } = await params;
  const store = await getOpsStore();
  const organization = await store.getOrganization(id);
  if (!organization) notFound();
  const [client, contentProfile, tasks] = await Promise.all([
    store.getClient(organization.clientId), store.getContentProfile(id), store.listTasks({ organizationId: id }),
  ]);
  return (
    <>
      <PageHeader title={organization.organizationName} description={`所属客户：${client?.clientName || "未知客户"}`} />
      <div className="ops-detail-toolbar"><StatusBadge status={organization.active ? "启用" : "停用"} /><form action={setOpsOrganizationActive}><input name="id" type="hidden" value={id} /><input name="active" type="hidden" value={organization.active ? "false" : "true"} /><button className="ops-button ops-button-secondary" type="submit">{organization.active ? "停用机构" : "恢复机构"}</button></form><a className="ops-button ops-button-primary" href={`/lvminglei/tasks/new?clientId=${organization.clientId}&organizationId=${id}`}>添加任务</a></div>
      <div className="ops-two-column balanced">
        <Panel title="机构基础资料">
          <form action={saveOpsOrganization} className="ops-form-grid compact">
            <input name="id" type="hidden" value={id} /><input name="clientId" type="hidden" value={organization.clientId} />
            <Field label="机构名称"><input name="organizationName" defaultValue={organization.organizationName} required /></Field>
            <Field label="机构类型"><input name="organizationType" defaultValue={organization.organizationType} /></Field>
            <Field wide label="机构说明"><textarea name="description" rows={5} defaultValue={organization.description} /></Field>
            <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存机构资料</button></div>
          </form>
        </Panel>
        <Panel title="当前任务"><p className="ops-large-number">{tasks.length}</p><p className="ops-muted">其中待处理 {tasks.filter((task) => ["待生成", "待处理"].includes(task.status)).length} 项</p><a className="ops-text-link" href={`/lvminglei/tasks?organizationId=${id}`}>查看机构任务</a></Panel>
      </div>
      <Panel title="内容资料（为后续生成阶段准备）">
        <form action={saveOpsContentProfile} className="ops-form-grid">
          <input name="organizationId" type="hidden" value={id} />
          <Field wide label="详细介绍"><textarea name="detailedIntro" rows={4} defaultValue={contentProfile?.detailedIntro} /></Field>
          <Field wide label="服务项目"><textarea name="services" rows={3} defaultValue={contentProfile?.services} /></Field>
          <Field wide label="真实优势"><textarea name="realAdvantages" rows={3} defaultValue={contentProfile?.realAdvantages} /></Field>
          <Field label="团队信息"><textarea name="teamInfo" rows={3} defaultValue={contentProfile?.teamInfo} /></Field>
          <Field label="资质信息"><textarea name="qualifications" rows={3} defaultValue={contentProfile?.qualifications} /></Field>
          <Field wide label="常见问答"><textarea name="faq" rows={4} defaultValue={contentProfile?.faq} /></Field>
          <Field label="受众顾虑"><textarea name="audienceConcerns" rows={3} defaultValue={contentProfile?.audienceConcerns} /></Field>
          <Field label="写作风格"><textarea name="writingStyle" rows={3} defaultValue={contentProfile?.writingStyle} /></Field>
          <Field label="禁止宣称"><textarea name="prohibitedClaims" rows={3} defaultValue={contentProfile?.prohibitedClaims} /></Field>
          <Field label="禁用词"><textarea name="bannedWords" rows={3} defaultValue={contentProfile?.bannedWords} /></Field>
          <Field label="参考账号"><textarea name="referenceAccounts" rows={3} defaultValue={contentProfile?.referenceAccounts} /></Field>
          <Field label="关键词"><textarea name="keywords" rows={3} defaultValue={contentProfile?.keywords} /></Field>
          <Field wide label="已使用关键词"><textarea name="usedKeywords" rows={3} defaultValue={contentProfile?.usedKeywords} /></Field>
          <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存内容资料</button></div>
        </form>
      </Panel>
    </>
  );
}
