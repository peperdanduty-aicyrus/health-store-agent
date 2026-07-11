import Link from "next/link";
import { logout } from "@/app/actions";
import { EmptyState, Panel } from "@/components/ops/OpsUi";
import { requireUser } from "@/lib/auth/session";
import { formatChinaDateTime } from "@/lib/date-format";
import { getDataStore } from "@/lib/data/repository";
import { sceneDefinitions, type SceneKey } from "@/lib/domain/scenes";
import { getOpsStore } from "@/lib/ops/repository";

const contentTypes: Array<{ label: string; scene: SceneKey; description: string }> = [
  { label: "公众号文章", scene: "official_account", description: "项目介绍、活动通知与门店动态。" },
  { label: "朋友圈内容", scene: "moments", description: "适合日常发布的短文案与配图建议。" },
  { label: "小红书内容", scene: "xiaohongshu", description: "标题、正文与评论区引导。" },
  { label: "短视频文案", scene: "douyin_kuaishou", description: "标题、口播、字幕与评论引导。" },
  { label: "AI 搜索文章", scene: "official_account", description: "基于真实机构资料整理可检索文章。" },
];

export default async function OperatorAppPage({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const profile = await requireUser();
  const requestedOrganizationId = (await searchParams).organizationId || "";
  const [opsStore, dataStore] = await Promise.all([getOpsStore(), getDataStore()]);
  const [assignments, organizations, generations] = await Promise.all([
    opsStore.listAssignments(profile.id),
    opsStore.listOrganizations(),
    dataStore.listGenerations({ userId: profile.id }),
  ]);
  const allowedOrganizationIds = new Set(assignments.map((item) => item.organizationId));
  const assignedOrganizations = organizations.filter((item) => item.active && allowedOrganizationIds.has(item.id));
  const selectedOrganization = assignedOrganizations.find((item) => item.id === requestedOrganizationId) || assignedOrganizations[0];
  const latestGenerations = generations.slice(0, 4);

  return (
    <main className="operator-shell">
      <header className="operator-topbar"><div><p>门店线上运营与 AI 搜索优化</p><h1>内容生成工作台</h1></div><div><span>{profile.storeName || profile.phone}</span><form action={logout}><button className="ops-button ops-button-secondary" type="submit">退出登录</button></form></div></header>
      <div className="operator-content operator-workbench">
        <section className="operator-welcome"><div><p>运营内容工作台</p><h2>为被分配机构准备内容</h2><span>机构范围由服务端校验；此处不提供合同、费用、收款或客户续费信息。</span></div></section>
        {assignedOrganizations.length === 0 ? <EmptyState title="暂未分配机构" description="请联系管理员在系统管理中为当前账号分配机构。" /> : (
          <>
            <form className="operator-org-picker" action="/app" method="get"><span>当前被分配机构</span><select defaultValue={selectedOrganization?.id} name="organizationId">{assignedOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.organizationName}</option>)}</select><button className="ops-button ops-button-secondary" type="submit">切换机构</button></form>
            <section className="operator-content-grid">
              <Panel title={selectedOrganization ? `${selectedOrganization.organizationName} · 内容生成` : "内容生成"}>
                <div className="operator-content-types">{contentTypes.map((item) => <Link className="operator-content-type" href={`/app/generate/${item.scene}?organizationId=${selectedOrganization?.id || ""}`} key={item.label}><strong>{item.label}</strong><span>{item.description}</span></Link>)}</div>
              </Panel>
              <div className="ops-stack">
                <Panel title="最近生成" action={<Link className="ops-text-link" href="/app/history">全部历史</Link>}>
                  {latestGenerations.length ? latestGenerations.map((record) => <div className="operator-generation-row" key={record.id}><strong>{record.projectName || sceneDefinitions[record.generationType].label}</strong><span>{sceneDefinitions[record.generationType].label} · {formatChinaDateTime(record.createdAt)}</span></div>) : <EmptyState compact title="暂无生成记录" description="从左侧内容类型开始生成" />}
                </Panel>
                <Panel title="草稿"><EmptyState compact title="暂无草稿" description="当前版本尚未启用草稿保存，已生成内容可在历史记录查看。" /></Panel>
                <Panel title="历史记录"><Link className="ops-button ops-button-secondary" href="/app/history">查看生成历史</Link></Panel>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
