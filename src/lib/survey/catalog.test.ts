import { describe, expect, it } from "vitest";
import { buildStoreSearchText, normalizeStoreSearchText } from "./search";
import { createSurveyMemoryStore } from "./store";

describe("survey catalog", () => {
  it("normalizes aliases for case-insensitive and punctuation-insensitive store search", () => {
    expect(normalizeStoreSearchText("Little MO&Co.")).toBe("littlemoco");
    expect(normalizeStoreSearchText("Dr.Kong／江博士")).toBe("drkong江博士");
    expect(normalizeStoreSearchText("荣耀 honor")).toBe("荣耀honor");

    const text = buildStoreSearchText({
      aliases: ["little mo", "mo&co", "小MO"],
      brandName: "Little MO&Co.",
      storeName: "Little MO&Co. Kids",
    });

    expect(text).toContain("littlemoco");
    expect(text).toContain("小mo");
    expect(text).toContain("kids");
  });

  it("supports one brand with multiple concrete stores", async () => {
    const store = createSurveyMemoryStore();
    const mall = await store.getDefaultMall();
    const category = await store.createCategory({
      enabled: true,
      mallId: mall.id,
      name: "儿童鞋服",
      sortOrder: 2,
    });
    const brand = await store.upsertBrand({ mallId: mall.id, name: "Little MO&Co." });

    const first = await store.createStore({
      areaSqm: 88,
      brandId: brand.id,
      categoryId: category.id,
      chainStore: true,
      contactPhone: "13800000001",
      contractEndDate: "2027-12-31",
      contractStartDate: "2026-01-01",
      displayLocation: "L2-201",
      floor: "L2",
      managerName: "张店长",
      mallId: mall.id,
      operationMode: "直营",
      operatorName: "营运一组",
      rentMode: "固定租金",
      staffCount: 6,
      status: "active",
      storeCode: "MO-201",
      storeName: "Little MO&Co. 儿童店",
      subcategoryId: "",
      unitNo: "201",
    });
    const second = await store.createStore({
      ...first,
      id: undefined,
      displayLocation: "L3-305",
      floor: "L3",
      storeCode: "MO-305",
      unitNo: "305",
    });

    expect(first.brandId).toBe(second.brandId);
    expect(first.id).not.toBe(second.id);
    expect((await store.listStores()).filter((item) => item.brandId === brand.id)).toHaveLength(2);
  });
});
