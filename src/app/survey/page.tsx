import Link from "next/link";
import { cookies, headers } from "next/headers";
import { CheckCircle2, Search } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMerchantEditCookieName } from "@/lib/survey/merchant-cookie";
import { ClearSurveyDraft } from "@/components/survey/ClearSurveyDraft";
import { MerchantSurveyForm } from "@/components/survey/MerchantSurveyForm";
import { getSurveyFieldDefinitionsForCategory, getCurrentSurveyPeriod, surveyStoredFormFieldToDefinition } from "@/lib/survey/merchant-form";
import { verifyMerchantEditToken } from "@/lib/survey/merchant-token";
import { checkSurveyRateLimit, getSurveyClientKey } from "@/lib/survey/rate-limit";
import { getSurveyStore } from "@/lib/survey/repository";

export const metadata: Metadata = {
  description: "商户月度经营数据填报入口。",
  title: "月度经营数据填报",
};

export default async function SurveyMerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; periodMonth?: string; q?: string; storeId?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const defaultPeriod = getCurrentSurveyPeriod();
  const mall = await store.getDefaultMall();
  const openPeriods = await store.resolveMerchantFillPeriods(mall.id, new Date());
  const selectedPeriod = openPeriods.find((item) => item.periodMonth === params.periodMonth) ?? openPeriods[0];
  const period = selectedPeriod
    ? {
        isLate: selectedPeriod.status === "reopened" || new Date() > new Date(selectedPeriod.normalFillEndsAt || defaultPeriod.normalFillEndsAt),
        normalFillEndsAt: selectedPeriod.reopenedUntil || selectedPeriod.normalFillEndsAt || defaultPeriod.normalFillEndsAt,
        periodMonth: selectedPeriod.periodMonth,
      }
    : defaultPeriod;

  if (params.storeId) {
    const selectedStore = await store.getStoreById(params.storeId);
    if (!selectedStore || selectedStore.status !== "active") {
      return <Shell><EmptyState message="暂未找到您的店铺，请联系营运人员核对或添加门店资料。" /></Shell>;
    }

    const existing = await store.getMerchantSubmissionForStoreMonth(selectedStore.id, period.periodMonth);
    const editToken = (await cookies()).get(getMerchantEditCookieName(selectedStore.id, period.periodMonth))?.value;
    const canEdit = existing
      ? Boolean(editToken) &&
        new Date() <= new Date(existing.merchantEditUntil) &&
        (await verifyMerchantEditToken(editToken || "", existing.merchantEditTokenHash))
      : true;

    if (params.submitted && existing) {
      return (
        <Shell>
          <Receipt submission={existing} store={selectedStore} />
        </Shell>
      );
    }

    if (existing && !canEdit) {
      return (
        <Shell>
          <StoreSummary store={selectedStore} />
          <div className="mt-5 rounded-lg border border-coral/20 bg-coral/10 p-5 text-coral">
            <h2 className="text-lg font-semibold">本店本月数据已提交</h2>
            <p className="mt-2 text-sm leading-6">当前浏览器没有有效修改权限，或已超过24小时修改期限。如需修改请联系营运人员。</p>
          </div>
          <Link className="mt-4 inline-flex rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-medium" href="/survey">
            重新选择店铺
          </Link>
        </Shell>
      );
    }

    const configuredFields = await store.listEnabledFormFields(selectedStore.mallId, selectedStore.formCategoryCode || selectedStore.categoryId);
    const fields = configuredFields.length > 0
      ? configuredFields.map(surveyStoredFormFieldToDefinition)
      : getSurveyFieldDefinitionsForCategory(selectedStore.categoryName);
    const fieldValues = existing ? (JSON.parse(existing.fieldValuesJson || "{}") as Record<string, unknown>) : {};
    return (
      <Shell>
        <StoreSummary store={selectedStore} />
        <div className="mt-5 rounded-lg border border-moss/20 bg-moss/10 p-4 text-sm leading-6 text-moss">
          <p>本次填写：{formatMonth(period.periodMonth)}经营数据</p>
          <p>正常填报截止：{formatDate(period.normalFillEndsAt)}</p>
          {period.isLate ? <p>当前为逾期补填，系统将保存逾期标记。</p> : null}
          {existing ? <p>当前浏览器可在截止时间前修改本次记录。</p> : null}
        </div>
        <div className="mt-5">
          <MerchantSurveyForm
            defaultFieldValues={{
              ...fieldValues,
              member_recharge_wan: existing?.memberRechargeWan,
              sales_target_wan: existing?.salesTargetWan,
              self_reported_sales_wan: existing?.selfReportedSalesWan,
            }}
            errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
            fields={fields}
            periodLabel={period.periodMonth}
            storeId={selectedStore.id}
          />
        </div>
      </Shell>
    );
  }

  const searchAllowed = params.q
    ? checkSurveyRateLimit("merchant_search", getSurveyClientKey(await headers()), { limit: 60, windowMs: 60_000 })
    : true;
  const results = params.q && searchAllowed ? await store.searchPublicStores(params.q) : [];
  return (
    <Shell>
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">月度经营数据填报</h1>
        <p className="mt-2 text-sm leading-6 text-ink/62">请输入品牌名或店铺名，从系统已有门店中选择。</p>
        <form className="mt-5 flex gap-2" method="get">
          <input
            className="min-h-12 flex-1 rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
            defaultValue={params.q || ""}
            name="q"
            placeholder="请输入品牌名或店铺名"
          />
          <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-4 text-white" type="submit">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </section>

      {params.q ? (
        <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">搜索结果</h2>
          <div className="mt-4 grid gap-3">
            {results.map((item) => (
              <Link
                className="rounded-md border border-ink/10 bg-paper p-4"
                href={`/survey?storeId=${item.id}`}
                key={item.id}
              >
                <p className="font-semibold text-ink">{item.brandName || item.storeName}</p>
                <p className="mt-1 text-sm text-ink/62">{item.displayLocation} · {item.categoryName}</p>
              </Link>
            ))}
            {!searchAllowed ? <EmptyState message="操作过于频繁，请稍后再试。" /> : null}
            {searchAllowed && results.length === 0 ? <EmptyState message="暂未找到您的店铺，请联系营运人员核对或添加门店资料。" /> : null}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-paper px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

function StoreSummary({
  store,
}: {
  store: { brandName: string; categoryName: string; displayLocation: string; storeName: string; subcategoryName: string };
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-coral">门店确认</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">{store.brandName || store.storeName}</h1>
      <p className="mt-2 text-sm text-ink/62">{store.displayLocation} · {store.subcategoryName || store.categoryName}</p>
      <div className="mt-4 flex gap-2">
        <Link className="rounded-md border border-ink/15 bg-paper px-4 py-2 text-sm font-medium" href="/survey">重新选择店铺</Link>
      </div>
    </section>
  );
}

function Receipt({
  store,
  submission,
}: {
  store: { brandName: string; displayLocation: string; id: string };
  submission: {
    fieldValuesJson: string;
    firstSubmittedAt: string;
    merchantEditUntil: string;
    periodMonth: string;
    salesTargetWan: number;
    selfReportedSalesWan: number;
  };
}) {
  const values = JSON.parse(submission.fieldValuesJson || "{}") as Record<string, string>;
  return (
    <section className="rounded-lg border border-moss/20 bg-white p-5 shadow-sm">
      <ClearSurveyDraft draftKey={`survey-draft-${store.id}-${submission.periodMonth}`} />
      <CheckCircle2 className="h-9 w-9 text-moss" />
      <h1 className="mt-4 text-2xl font-semibold text-ink">本次数据已提交</h1>
      <p className="mt-2 rounded-md bg-moss/10 p-3 text-sm leading-6 text-moss">本次数据已提交。当前浏览器可在截止时间前修改本次记录。</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <Row label="品牌名称" value={store.brandName} />
        <Row label="楼层及铺位" value={store.displayLocation} />
        <Row label="填报月份" value={formatMonth(submission.periodMonth)} />
        <Row label="商户自报销售额" value={`${submission.selfReportedSalesWan}万元`} />
        <Row label="上月销售目标" value={`${submission.salesTargetWan}万元`} />
        <Row label="经营自评" value={String(values.business_self_rating || values.businessSelfReview || "")} />
        <Row label="下月销售目标" value={`${values.next_sales_target_wan || values.nextMonthTargetWan || ""}万元`} />
        <Row label="首次提交时间" value={formatDateTime(submission.firstSubmittedAt)} />
        <Row label="可修改截止时间" value={formatDateTime(submission.merchantEditUntil)} />
      </dl>
      <Link className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" href={`/survey?storeId=${encodeURIComponent(store.id)}`}>
        返回修改
      </Link>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-ink/8 pb-2">
      <dt className="text-ink/55">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-paper p-4 text-sm leading-6 text-ink/62">{message}</p>;
}

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return `${year}年${value}月`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}年${month}月${day}日`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
