import {
  createSurveyCategory,
  createSurveyOperator,
  createSurveySubcategory,
  saveSurveyStore,
  toggleSurveyStaffEnabled,
  updateSurveyStaffTerm,
  updateSurveyStoreAliases,
  updateSurveyStoreStatus,
} from "@/app/survey-actions";
import { SurveyLoginForm } from "@/components/survey/SurveyLoginForm";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { SurveyStoreImportForm } from "@/components/survey/SurveyStoreImportForm";
import { canOpenNewSurveyPeriod } from "@/lib/survey/access";
import { getSurveyStore } from "@/lib/survey/repository";
import { getCurrentSurveyStaff } from "@/lib/survey/session";
import type { SurveyCategory, SurveyStaffAccount, SurveyStore, SurveySubcategory } from "@/lib/survey/types";

export default async function SurveyCyrusPage() {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "super_admin") {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-sm font-semibold text-coral">商场店铺调研系统总后台</p>
          <SurveyLoginForm title="总管理员登录" />
        </div>
      </main>
    );
  }

  const store = await getSurveyStore();
  const [accounts, categories, subcategories, stores, aliases, logs] = await Promise.all([
    store.listStaffAccounts(),
    store.listCategories(),
    store.listSubcategories(),
    store.listStores(),
    store.listAliases(),
    store.listAuditLogs(),
  ]);

  return (
    <SurveyShell staff={staff} title="商场店铺调研系统总后台">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="营运账号" value={String(accounts.filter((item) => item.role === "operator").length)} />
          <MetricCard label="门店" value={String(stores.length)} />
          <MetricCard label="业态" value={String(categories.length)} />
          <MetricCard label="可开启新月份" value={canOpenNewSurveyPeriod(staff) ? "可以" : "已到期"} />
        </section>

        <OperatorSection accounts={accounts} />
        <CategorySection categories={categories} subcategories={subcategories} />
        <StoreSection aliases={aliases} categories={categories} stores={stores} subcategories={subcategories} />
        <SurveyStoreImportForm />
        <AuditLogSection logs={logs} />
      </div>
    </SurveyShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-ink/58">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function OperatorSection({ accounts }: { accounts: SurveyStaffAccount[] }) {
  const operators = accounts.filter((account) => account.role === "operator");
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-ink">营运账号与权限期限</h2>
      <form action={createSurveyOperator} className="mt-4 grid gap-3 lg:grid-cols-7">
        <Field label="登录名" name="loginName" required />
        <Field label="初始密码" name="password" required type="password" />
        <Field label="显示名称" name="displayName" required />
        <Field label="联系电话" name="phone" />
        <Field defaultValue="2026-06-01" label="开始日期" name="startsAt" type="date" />
        <Select label="权限" name="termMonths" options={["3", "6", "12"]} />
        <button className="min-h-11 self-end rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">
          创建营运账号
        </button>
      </form>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>{["登录名", "名称", "状态", "开始", "到期", "续期", "禁用"].map((item) => <th className="px-3 py-2" key={item}>{item}</th>)}</tr>
          </thead>
          <tbody>
            {operators.map((account) => (
              <tr className="border-t border-ink/8" key={account.id}>
                <td className="px-3 py-2">{account.loginName}</td>
                <td className="px-3 py-2">{account.displayName}</td>
                <td className="px-3 py-2">{account.enabled ? "启用" : "禁用"}</td>
                <td className="px-3 py-2">{account.startsAt}</td>
                <td className="px-3 py-2">{account.expiresAt}</td>
                <td className="px-3 py-2">
                  <form action={updateSurveyStaffTerm} className="flex gap-2">
                    <input name="accountId" type="hidden" value={account.id} />
                    <input className="w-36 rounded-md border border-ink/12 bg-paper px-2 py-1" name="startsAt" type="date" defaultValue={account.startsAt} />
                    <select className="rounded-md border border-ink/12 bg-paper px-2 py-1" name="termMonths" defaultValue="3">
                      <option value="3">3个月</option>
                      <option value="6">6个月</option>
                      <option value="12">12个月</option>
                    </select>
                    <button className="rounded-md bg-moss px-3 py-1 text-white" type="submit">保存</button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <form action={toggleSurveyStaffEnabled}>
                    <input name="accountId" type="hidden" value={account.id} />
                    <input name="enabled" type="hidden" value={account.enabled ? "false" : "true"} />
                    <button className="font-medium text-coral" type="submit">{account.enabled ? "禁用" : "启用"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategorySection({ categories, subcategories }: { categories: SurveyCategory[]; subcategories: SurveySubcategory[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">业态配置</h2>
        <form action={createSurveyCategory} className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_120px]">
          <Field label="业态名称" name="name" required />
          <Field defaultValue="99" label="排序" name="sortOrder" type="number" />
          <button className="min-h-11 self-end rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">新增</button>
        </form>
        <div className="mt-4 grid gap-2">
          {categories.map((category) => (
            <div className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" key={category.id}>
              {category.sortOrder}. {category.name} · {category.enabled ? "启用" : "停用"}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">子业态配置</h2>
        <form action={createSurveySubcategory} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_120px_120px]">
          <label className="block text-sm font-medium text-ink/75">
            所属业态
            <select className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3" name="categoryId">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <Field label="子业态名称" name="name" required />
          <Field defaultValue="99" label="排序" name="sortOrder" type="number" />
          <button className="min-h-11 self-end rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">新增</button>
        </form>
        <div className="mt-4 grid gap-2">
          {subcategories.map((subcategory) => (
            <div className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" key={subcategory.id}>
              {subcategory.name} · {subcategory.enabled ? "启用" : "停用"}
            </div>
          ))}
          {subcategories.length === 0 ? <p className="text-sm text-ink/58">暂无子业态。</p> : null}
        </div>
      </div>
    </section>
  );
}

function StoreSection({
  aliases,
  categories,
  stores,
  subcategories,
}: {
  aliases: Array<{ alias: string; storeId: string }>;
  categories: SurveyCategory[];
  stores: SurveyStore[];
  subcategories: SurveySubcategory[];
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-ink">品牌与门店管理</h2>
      <form action={saveSurveyStore} className="mt-4 grid gap-3 lg:grid-cols-4">
        <Field label="品牌名称" name="brandName" required />
        <Field label="店铺名称" name="storeName" required />
        <Field label="店铺编号" name="storeCode" />
        <Field label="楼层" name="floor" required />
        <Field label="铺位号" name="unitNo" required />
        <label className="block text-sm font-medium text-ink/75">
          所属业态
          <select className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3" name="categoryId">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink/75">
          子业态
          <select className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3" name="subcategoryId">
            <option value="">无</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>
        </label>
        <Field label="合同签约时间" name="contractStartDate" type="date" />
        <Field label="合同到期时间" name="contractEndDate" type="date" />
        <Field label="店铺面积" name="areaSqm" type="number" />
        <Field label="员工人数" name="staffCount" type="number" />
        <Field label="店长姓名" name="managerName" />
        <Field label="联系电话" name="contactPhone" />
        <Field label="经营模式" name="operationMode" />
        <Select label="是否连锁" name="chainStore" options={["true", "false"]} />
        <Field label="负责营运人员" name="operatorName" />
        <Field label="租金方式" name="rentMode" />
        <Select label="门店状态" name="status" options={["active", "disabled", "archived"]} />
        <button className="min-h-11 self-end rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">
          新增门店
        </button>
      </form>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>{["品牌", "门店", "铺位", "业态", "面积", "员工", "状态", "别名", "状态操作"].map((item) => <th className="px-3 py-2" key={item}>{item}</th>)}</tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr className="border-t border-ink/8 align-top" key={store.id}>
                <td className="px-3 py-2">{store.brandName}</td>
                <td className="px-3 py-2">{store.storeName}</td>
                <td className="px-3 py-2">{store.displayLocation}</td>
                <td className="px-3 py-2">{store.categoryName}</td>
                <td className="px-3 py-2">{store.areaSqm}</td>
                <td className="px-3 py-2">{store.staffCount}</td>
                <td className="px-3 py-2">{store.status}</td>
                <td className="px-3 py-2">
                  <form action={updateSurveyStoreAliases} className="flex min-w-72 gap-2">
                    <input name="storeId" type="hidden" value={store.id} />
                    <input
                      className="min-h-9 flex-1 rounded-md border border-ink/12 bg-paper px-2"
                      name="aliases"
                      defaultValue={aliases.filter((alias) => alias.storeId === store.id).map((alias) => alias.alias).join(";")}
                    />
                    <button className="rounded-md bg-moss px-3 py-1 text-white" type="submit">保存</button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {(["active", "disabled", "archived"] as const).map((status) => (
                      <form action={updateSurveyStoreStatus} key={status}>
                        <input name="storeId" type="hidden" value={store.id} />
                        <input name="status" type="hidden" value={status} />
                        <button className="rounded-md border border-ink/12 px-2 py-1" type="submit">{status}</button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {stores.length === 0 ? (
              <tr className="border-t border-ink/8">
                <td className="px-3 py-5 text-ink/58" colSpan={9}>暂无门店，可以先手工新增或粘贴 Excel 数据导入。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditLogSection({ logs }: { logs: Array<{ action: string; createdAt: string; detailJson: string; targetType: string }> }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-ink">操作日志</h2>
      <div className="mt-4 grid gap-2">
        {logs.slice(0, 20).map((log, index) => (
          <div className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" key={`${log.createdAt}-${index}`}>
            <span className="font-medium">{log.action}</span> · {log.targetType} · {log.createdAt}
            <p className="mt-1 break-all text-ink/58">{log.detailJson}</p>
          </div>
        ))}
        {logs.length === 0 ? <p className="text-sm text-ink/58">暂无操作日志。</p> : null}
      </div>
    </section>
  );
}

function Field({
  defaultValue,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block text-sm font-medium text-ink/75">
      {label}
      <select className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3" name={name}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
