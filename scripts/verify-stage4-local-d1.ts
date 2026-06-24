import { getSurveyStore } from "../src/lib/survey/repository";

const store = await getSurveyStore();
const seeded = await store.ensureSurveyDemoStores();

await store.upsertPosSale({
  actorId: "codex-local-verify",
  mallId: seeded.mall.id,
  periodMonth: "2026-05",
  remark: "Codex本地D1验收验证",
  salesWan: 18.8,
  storeId: seeded.honor.id,
  targetSalesWan: 17.5,
});

await store.reopenSurveyPeriod({
  actorId: "codex-local-verify",
  mallId: seeded.mall.id,
  periodMonth: "2026-05",
  reopenedUntil: "2026-06-30",
});

await store.createFollowUp({
  actorId: "codex-local-verify",
  followUpDate: "2026-06-23",
  followUpItem: "Codex本地D1验收验证",
  followUpMethod: "微信",
  mallId: seeded.mall.id,
  merchantFeedback: "已写入本地D1",
  nextAction: "验收复核",
  nextFollowUpDate: "2026-06-24",
  ownerName: "Codex",
  periodMonth: "2026-05",
  status: "跟进中",
  storeId: seeded.honor.id,
  warningId: "W02",
});

const result = {
  fields: (await store.listEnabledFormFields(seeded.mall.id, seeded.honor.formCategoryCode || seeded.honor.categoryId)).length,
  followups: (await store.listFollowUps("2026-05", seeded.mall.id)).filter((item) => item.followUpItem.includes("Codex")).length,
  periods: (await store.resolveMerchantFillPeriods(seeded.mall.id, new Date("2026-06-23T00:00:00Z"))).filter((item) => item.periodMonth === "2026-05").length,
  pos: (await store.listPosSales("2026-05", seeded.mall.id)).filter((item) => item.remark.includes("Codex")).length,
};

console.log(JSON.stringify(result));
