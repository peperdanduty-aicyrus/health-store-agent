import { describe, expect, it } from "vitest";
import { parseStoreImportText, validateStoreImportRows } from "./store-import";
import type { SurveyCategory, SurveyStore } from "./types";

describe("survey store import", () => {
  const categories: SurveyCategory[] = [
    {
      createdAt: "2026-06-23T00:00:00.000Z",
      enabled: true,
      id: "cat_kids",
      mallId: "mall_001",
      name: "儿童鞋服",
      sortOrder: 2,
      updatedAt: "2026-06-23T00:00:00.000Z",
    },
  ];

  const existingStores: SurveyStore[] = [
    {
      areaSqm: 80,
      brandId: "brand_001",
      brandName: "Little MO&Co.",
      categoryId: "cat_kids",
      categoryName: "儿童鞋服",
      chainStore: true,
      contactPhone: "",
      contractEndDate: "",
      contractStartDate: "",
      createdAt: "2026-06-23T00:00:00.000Z",
      displayLocation: "L2-201",
      floor: "L2",
      id: "store_001",
      mallId: "mall_001",
      mallName: "测试商场",
      managerName: "",
      operationMode: "",
      operatorName: "",
      rentMode: "",
      searchText: "littlemoco l2201",
      staffCount: 5,
      status: "active",
      storeCode: "MO-201",
      storeName: "Little MO&Co.",
      subcategoryId: "",
      subcategoryName: "",
      unitNo: "201",
      updatedAt: "2026-06-23T00:00:00.000Z",
    },
  ];

  it("parses Excel-copied tabular text into row objects", () => {
    const rows = parseStoreImportText(
      "品牌名称\t店铺名称\t店铺编号\t楼层\t铺位号\t所属业态\nLittle MO&Co.\tLittle MO&Co. Kids\tMO-305\tL3\t305\t儿童鞋服",
    );

    expect(rows).toEqual([
      {
        品牌名称: "Little MO&Co.",
        店铺名称: "Little MO&Co. Kids",
        店铺编号: "MO-305",
        楼层: "L3",
        铺位号: "305",
        所属业态: "儿童鞋服",
      },
    ]);
  });

  it("prechecks rows, allows valid rows, and reports row-level errors without blocking the batch", () => {
    const rows = parseStoreImportText(
      [
        "品牌名称,店铺名称,店铺编号,楼层,铺位号,所属业态,店铺面积,员工人数,搜索别名",
        "Little MO&Co.,Little MO&Co. Kids,MO-305,L3,305,儿童鞋服,92,7,\"little mo;mo&co;小MO\"",
        "Little MO&Co.,Little MO&Co.,MO-201,L2,201,儿童鞋服,80,5,mo",
        "荣耀honor,荣耀手机,HONOR-101,L1,101,不存在业态,70,4,honor",
      ].join("\n"),
    );

    const result = validateStoreImportRows(rows, {
      categories,
      existingStores,
      mallId: "mall_001",
    });

    expect(result.validRows).toHaveLength(1);
    expect(result.errorRows).toEqual([
      expect.objectContaining({ rowNumber: 3, reason: expect.stringContaining("重复门店") }),
      expect.objectContaining({ rowNumber: 4, reason: expect.stringContaining("业态不存在") }),
    ]);
  });
});
