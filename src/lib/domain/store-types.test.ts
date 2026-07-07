import { describe, expect, it } from "vitest";
import {
  canonicalStoreTypes,
  getIndustrySafetyRules,
  getStoreTypePlaceholders,
  normalizeStoreType,
  sourceChannels,
} from "./store-types";

describe("agent store type catalog", () => {
  it("defines the nine supported local store types and six source channels", () => {
    expect(canonicalStoreTypes).toEqual([
      "中医馆 / 中医诊所",
      "口腔门诊",
      "推拿按摩SPA馆",
      "美容美业",
      "宠物医院",
      "综合门诊",
      "少儿推拿",
      "餐饮门店",
      "儿童教培",
    ]);
    expect(sourceChannels).toEqual(["闲鱼", "微信", "小红书", "抖音", "快手", "其他"]);
  });

  it("maps legacy health-store values without rewriting stored data", () => {
    expect(normalizeStoreType("推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆")).toBe("推拿按摩SPA馆");
    expect(normalizeStoreType("健康管理中心 / 体检中心")).toBe("综合门诊");
    expect(normalizeStoreType("其他本地健康门店")).toBe("综合门诊");
    expect(normalizeStoreType("餐饮门店")).toBe("餐饮门店");
  });

  it("returns industry-specific generation placeholders", () => {
    expect(getStoreTypePlaceholders("餐饮门店")).toMatchObject({
      projectName: expect.stringContaining("双人餐"),
      targetCustomer: expect.stringContaining("家庭聚餐"),
    });
    expect(getStoreTypePlaceholders("儿童教培")).toMatchObject({
      projectName: expect.stringContaining("试听课"),
      targetCustomer: expect.stringContaining("小学生家长"),
    });
  });

  it("returns separate safety language for medical, beauty, dining, and education stores", () => {
    expect(getIndustrySafetyRules("口腔门诊")).toContain("根治");
    expect(getIndustrySafetyRules("美容美业")).toContain("100%有效");
    expect(getIndustrySafetyRules("餐饮门店")).toContain("全城第一");
    expect(getIndustrySafetyRules("儿童教培")).toContain("保证提分");
  });
});
