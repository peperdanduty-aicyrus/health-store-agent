import { describe, expect, it } from "vitest";
import { finalSurveyStoreRows, importFinalSurveyStores, summarizeFinalSurveyStoreRows } from "./real-store-data";
import { createSeededSurveyMemoryStore } from "./store";

describe("final 45-store import", () => {
  it("uses the 45-store operations workbook as the final source of enabled stores", () => {
    const summary = summarizeFinalSurveyStoreRows(finalSurveyStoreRows);

    expect(summary.totalStores).toBe(45);
    expect(summary.statusCounts).toEqual({ 启用: 45 });
    expect(summary.subcategoryCounts).toEqual({
      "3C数码": 10,
      儿童鞋服: 13,
      儿童用品: 1,
      家电: 4,
      家用精品: 2,
      美妆护肤: 4,
      日用杂货: 2,
      儿童游乐: 6,
      教培: 3,
    });
    expect(summary.aliasCount).toBe(65);
    expect(summary.duplicateStoreNos).toEqual([]);
    expect(summary.missingAreaStoreNos).toEqual([]);
    expect(summary.emptyStaffStoreNos).toEqual([]);
  });

  it("imports real stores, maps subcategories to seven form categories, and archives old withdrawn seeds", async () => {
    const store = await createSeededSurveyMemoryStore();
    const mall = await store.getDefaultMall();
    await importFinalSurveyStores(store, mall.id);

    const stores = await store.listStores();
    const activeStores = stores.filter((item) => item.status === "active");
    const archivedStores = stores.filter((item) => item.status === "archived");

    expect(activeStores).toHaveLength(45);
    expect(archivedStores.map((item) => item.brandName).sort()).toEqual(["SKECHERS Kids", "小主生活", "燕之屋", "荣泰"].sort());
    expect(activeStores.find((item) => item.storeCode === "L0467N01")).toMatchObject({
      areaSqm: 74,
      brandName: "little MO&Co.",
      categoryName: "儿童鞋服",
      displayLocation: "L04",
      staffCount: 2,
      subcategoryName: "儿童鞋服",
    });
    expect(activeStores.find((item) => item.storeCode === "L0219N02")).toMatchObject({
      categoryName: "家电及家用",
      subcategoryName: "家电",
    });
  });

  it("keeps public search on enabled stores and does not expose internal fields", async () => {
    const store = await createSeededSurveyMemoryStore();
    const mall = await store.getDefaultMall();
    await importFinalSurveyStores(store, mall.id);

    await store.updateStoreStatus((await store.listStores()).find((item) => item.brandName === "荣耀honor")!.id, "disabled");
    expect(await store.searchPublicStores("honor")).toEqual([]);

    const results = await store.searchPublicStores("mo");
    expect(results[0]).toMatchObject({
      brandName: "little MO&Co.",
      categoryName: "儿童鞋服",
      displayLocation: "L04",
    });
    expect(results[0]).not.toHaveProperty("areaSqm");
    expect(results[0]).not.toHaveProperty("staffCount");
    expect(results[0]).not.toHaveProperty("status");
  });
});
