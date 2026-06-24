import type { SurveyCategory, SurveyStore, SurveyStoreStatus } from "./types";

export type FinalSurveyStoreRow = {
  areaSqm: number;
  brandName: string;
  floorUnit: string;
  formCategoryCode: string;
  searchAliases: string;
  staffCount: number;
  status: "启用" | "停用" | "归档";
  storeNo: string;
  subcategoryName: string;
};

export const finalSurveyStoreRows: FinalSurveyStoreRow[] = [
  {
    "storeNo": "L0149N01",
    "brandName": "华为",
    "floorUnit": "L01",
    "subcategoryName": "3C数码",
    "areaSqm": 434.0,
    "staffCount": 16,
    "searchAliases": "huawei",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "L0158N01",
    "brandName": "大疆",
    "floorUnit": "L01",
    "subcategoryName": "3C数码",
    "areaSqm": 119.0,
    "staffCount": 6,
    "searchAliases": "DJI",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "L0126N002",
    "brandName": "小米",
    "floorUnit": "L01",
    "subcategoryName": "3C数码",
    "areaSqm": 505.0,
    "staffCount": 12,
    "searchAliases": "mi; xiaomi",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "L0132N003",
    "brandName": "尚宝",
    "floorUnit": "L01",
    "subcategoryName": "3C数码",
    "areaSqm": 136.0,
    "staffCount": 7,
    "searchAliases": "苹果",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "B0177N001",
    "brandName": "荣耀honor",
    "floorUnit": "B01",
    "subcategoryName": "3C数码",
    "areaSqm": 65.0,
    "staffCount": 5,
    "searchAliases": "荣耀; honor",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "B0159N03",
    "brandName": "OPPO",
    "floorUnit": "B01",
    "subcategoryName": "3C数码",
    "areaSqm": 48.0,
    "staffCount": 3,
    "searchAliases": "oppo",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "B0179N001",
    "brandName": "VIVO",
    "floorUnit": "B01",
    "subcategoryName": "3C数码",
    "areaSqm": 110.0,
    "staffCount": 2,
    "searchAliases": "vivo",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "B0105N01",
    "brandName": "samsung",
    "floorUnit": "B01",
    "subcategoryName": "3C数码",
    "areaSqm": 101.0,
    "staffCount": 2,
    "searchAliases": "三星; samsung",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "L0310N003",
    "brandName": "科大讯飞",
    "floorUnit": "L03",
    "subcategoryName": "3C数码",
    "areaSqm": 41.0,
    "staffCount": 2,
    "searchAliases": "讯飞; iFLYTEK",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "DB104A003",
    "brandName": "WEKOME",
    "floorUnit": "B01",
    "subcategoryName": "3C数码",
    "areaSqm": 15.0,
    "staffCount": 2,
    "searchAliases": "wekome",
    "status": "启用",
    "formCategoryCode": "DIGITAL_3C"
  },
  {
    "storeNo": "L0409N01",
    "brandName": "NIKE KIDS",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 157.0,
    "staffCount": 4,
    "searchAliases": "nike; kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0459N01",
    "brandName": "FILA KIDS",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 338.0,
    "staffCount": 5,
    "searchAliases": "fila; kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0456N01",
    "brandName": "Balabala",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 194.0,
    "staffCount": 3,
    "searchAliases": "巴拉巴拉; balabala",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0455N01",
    "brandName": "乐友",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 192.0,
    "staffCount": 7,
    "searchAliases": "",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0410N01",
    "brandName": "New Balance kids",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 98.0,
    "staffCount": 3,
    "searchAliases": "new balance; nb kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0416N02",
    "brandName": "M1&M2",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 36.0,
    "staffCount": 2,
    "searchAliases": "m1m2",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0401N04",
    "brandName": "Dr.Kong／江博士",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 112.0,
    "staffCount": 5,
    "searchAliases": "江博士; dr kong; drkong",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0407N01",
    "brandName": "adidas kids",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 159.0,
    "staffCount": 2,
    "searchAliases": "adidas; kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0469N03",
    "brandName": "安踏儿童",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 128.0,
    "staffCount": 3,
    "searchAliases": "安踏; anta kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0411N02",
    "brandName": "Asics Kids",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 93.0,
    "staffCount": 3,
    "searchAliases": "亚瑟士; asics; kids",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0463N01",
    "brandName": "jnby by JNBY",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 82.0,
    "staffCount": 2,
    "searchAliases": "jnby; 江南布衣",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0466N03",
    "brandName": "jiusuiban",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 67.0,
    "staffCount": 2,
    "searchAliases": "",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0467N01",
    "brandName": "little MO&Co.",
    "floorUnit": "L04",
    "subcategoryName": "儿童鞋服",
    "areaSqm": 74.0,
    "staffCount": 2,
    "searchAliases": "little mo; mo; mo&co; 小MO",
    "status": "启用",
    "formCategoryCode": "KIDS_FASHION"
  },
  {
    "storeNo": "L0453N02",
    "brandName": "玩具反斗城",
    "floorUnit": "L04",
    "subcategoryName": "儿童用品",
    "areaSqm": 798.0,
    "staffCount": 6,
    "searchAliases": "Toys R Us; 反斗城",
    "status": "启用",
    "formCategoryCode": "KIDS_PRODUCTS"
  },
  {
    "storeNo": "L0219N02",
    "brandName": "嘉德铭辉",
    "floorUnit": "L02",
    "subcategoryName": "家电",
    "areaSqm": 298.0,
    "staffCount": 6,
    "searchAliases": "",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0476N02",
    "brandName": "追觅",
    "floorUnit": "L04",
    "subcategoryName": "家电",
    "areaSqm": 79.0,
    "staffCount": 2,
    "searchAliases": "dreame",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0477N02",
    "brandName": "添可&科沃斯",
    "floorUnit": "L04",
    "subcategoryName": "家电",
    "areaSqm": 98.0,
    "staffCount": 2,
    "searchAliases": "添可; 科沃斯; tineco; ecovacs",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0479N02",
    "brandName": "iRest艾力斯特",
    "floorUnit": "L04",
    "subcategoryName": "家电",
    "areaSqm": 90.0,
    "staffCount": 2,
    "searchAliases": "irest; 艾力斯特",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0250N02",
    "brandName": "全棉时代",
    "floorUnit": "L02",
    "subcategoryName": "家用精品",
    "areaSqm": 266.0,
    "staffCount": 4,
    "searchAliases": "purcotton",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0253N03",
    "brandName": "谭木匠",
    "floorUnit": "L02",
    "subcategoryName": "家用精品",
    "areaSqm": 68.0,
    "staffCount": 4,
    "searchAliases": "",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0115N01",
    "brandName": "妍丽",
    "floorUnit": "L01",
    "subcategoryName": "美妆护肤",
    "areaSqm": 226.0,
    "staffCount": 5,
    "searchAliases": "",
    "status": "启用",
    "formCategoryCode": "BEAUTY_HEALTH"
  },
  {
    "storeNo": "B0176N01",
    "brandName": "THE COLORIST",
    "floorUnit": "B01",
    "subcategoryName": "美妆护肤",
    "areaSqm": 170.0,
    "staffCount": 3,
    "searchAliases": "调色师; colorist",
    "status": "启用",
    "formCategoryCode": "BEAUTY_HEALTH"
  },
  {
    "storeNo": "DL111N001",
    "brandName": "DIOMOMO",
    "floorUnit": "L01",
    "subcategoryName": "美妆护肤",
    "areaSqm": 18.0,
    "staffCount": 4,
    "searchAliases": "diomomo",
    "status": "启用",
    "formCategoryCode": "BEAUTY_HEALTH"
  },
  {
    "storeNo": "DL107N001",
    "brandName": "ANRUZ",
    "floorUnit": "L01",
    "subcategoryName": "美妆护肤",
    "areaSqm": 15.0,
    "staffCount": 3,
    "searchAliases": "anruz",
    "status": "启用",
    "formCategoryCode": "BEAUTY_HEALTH"
  },
  {
    "storeNo": "L0245N01",
    "brandName": "KKv",
    "floorUnit": "L02",
    "subcategoryName": "日用杂货",
    "areaSqm": 802.0,
    "staffCount": 8,
    "searchAliases": "kkv",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "B0172N03",
    "brandName": "名创优品",
    "floorUnit": "B01",
    "subcategoryName": "日用杂货",
    "areaSqm": 295.0,
    "staffCount": 6,
    "searchAliases": "miniso",
    "status": "启用",
    "formCategoryCode": "HOME_APPLIANCE"
  },
  {
    "storeNo": "L0316N01",
    "brandName": "纽西卡汽车小镇",
    "floorUnit": "L03",
    "subcategoryName": "儿童游乐",
    "areaSqm": 119.0,
    "staffCount": 3,
    "searchAliases": "纽西卡",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "L0323N03",
    "brandName": "米果象",
    "floorUnit": "L03",
    "subcategoryName": "儿童游乐",
    "areaSqm": 111.0,
    "staffCount": 2,
    "searchAliases": "米果象",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "DL306N01",
    "brandName": "派星球",
    "floorUnit": "L03",
    "subcategoryName": "儿童游乐",
    "areaSqm": 18.0,
    "staffCount": 3,
    "searchAliases": "派星球",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "DL403N01",
    "brandName": "恰恰特快车",
    "floorUnit": "L04",
    "subcategoryName": "儿童游乐",
    "areaSqm": 16.0,
    "staffCount": 2,
    "searchAliases": "恰恰特; 小火车",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "L0405N03",
    "brandName": "梦幻搭档",
    "floorUnit": "L04",
    "subcategoryName": "儿童游乐",
    "areaSqm": 55.0,
    "staffCount": 2,
    "searchAliases": "梦幻搭档",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "DL302N003",
    "brandName": "乐趣伙伴",
    "floorUnit": "L03",
    "subcategoryName": "儿童游乐",
    "areaSqm": 20.0,
    "staffCount": 2,
    "searchAliases": "乐趣伙伴",
    "status": "启用",
    "formCategoryCode": "KIDS_ENTERTAINMENT"
  },
  {
    "storeNo": "L0308N02",
    "brandName": "小代克勇士",
    "floorUnit": "L03",
    "subcategoryName": "教培",
    "areaSqm": 190.0,
    "staffCount": 6,
    "searchAliases": "小代克",
    "status": "启用",
    "formCategoryCode": "EDUCATION"
  },
  {
    "storeNo": "L0312N01",
    "brandName": "巴洛克艺术教育",
    "floorUnit": "L03",
    "subcategoryName": "教培",
    "areaSqm": 294.0,
    "staffCount": 6,
    "searchAliases": "巴洛克",
    "status": "启用",
    "formCategoryCode": "EDUCATION"
  },
  {
    "storeNo": "L0315N01",
    "brandName": "九拍",
    "floorUnit": "L03",
    "subcategoryName": "教培",
    "areaSqm": 165.0,
    "staffCount": 3,
    "searchAliases": "九拍",
    "status": "启用",
    "formCategoryCode": "EDUCATION"
  }
];

export const withdrawnStoreNames = ["SKECHERS Kids", "荣泰", "燕之屋", "小主生活"];

export const formCategoryNameByCode: Record<string, string> = {
  BEAUTY_HEALTH: "个护、健康品及美妆护肤",
  DIGITAL_3C: "3C数码",
  EDUCATION: "教培",
  HOME_APPLIANCE: "家电及家用",
  KIDS_ENTERTAINMENT: "儿童游乐",
  KIDS_FASHION: "儿童鞋服",
  KIDS_PRODUCTS: "儿童用品",
};

export function splitFinalStoreAliases(value: string): string[] {
  return value
    .split(/[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function summarizeFinalSurveyStoreRows(rows: FinalSurveyStoreRow[]) {
  const statusCounts: Record<string, number> = {};
  const subcategoryCounts: Record<string, number> = {};
  const seenStoreNos = new Map<string, number>();
  const duplicateStoreNos: string[] = [];
  const missingAreaStoreNos: string[] = [];
  const emptyStaffStoreNos: string[] = [];
  let aliasCount = 0;

  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
    subcategoryCounts[row.subcategoryName] = (subcategoryCounts[row.subcategoryName] ?? 0) + 1;
    aliasCount += splitFinalStoreAliases(row.searchAliases).length;
    seenStoreNos.set(row.storeNo, (seenStoreNos.get(row.storeNo) ?? 0) + 1);
    if (!row.areaSqm) missingAreaStoreNos.push(row.storeNo);
    if (!row.staffCount) emptyStaffStoreNos.push(row.storeNo);
  }
  for (const [storeNo, count] of seenStoreNos) {
    if (count > 1) duplicateStoreNos.push(storeNo);
  }

  return {
    aliasCount,
    duplicateStoreNos,
    emptyStaffStoreNos,
    missingAreaStoreNos,
    statusCounts,
    subcategoryCounts,
    totalStores: rows.length,
  };
}

export async function importFinalSurveyStores(
  store: {
    createStore(input: any): Promise<SurveyStore>;
    listCategories(): Promise<SurveyCategory[]>;
    listStores(): Promise<SurveyStore[]>;
    setStoreAliases(storeId: string, aliases: string[]): Promise<unknown>;
    updateStore(input: any): Promise<SurveyStore | null>;
    updateStoreStatus(id: string, status: SurveyStoreStatus): Promise<SurveyStore | null>;
    upsertBrand(input: { mallId: string; name: string }): Promise<{ id: string }>;
  },
  mallId: string,
) {
  const categories = await store.listCategories();
  const categoriesByName = new Map(categories.map((category) => [category.name, category]));
  const existingStores = await store.listStores();
  const existingByStoreNo = new Map(existingStores.map((item) => [item.storeCode, item]));

  for (const row of finalSurveyStoreRows) {
    const categoryName = formCategoryNameByCode[row.formCategoryCode] ?? row.subcategoryName;
    const category = categoriesByName.get(categoryName) ?? categories[0];
    const brand = await store.upsertBrand({ mallId, name: row.brandName });
    const input = {
      areaSqm: row.areaSqm,
      brandId: brand.id,
      categoryId: category.id,
      chainStore: false,
      contactPhone: "",
      contractEndDate: "",
      contractStartDate: "",
      displayLocation: row.floorUnit,
      floor: row.floorUnit,
      formCategoryCode: row.formCategoryCode,
      managerName: "",
      mallId,
      operationMode: "",
      operatorName: "",
      rentMode: "",
      staffCount: row.staffCount,
      status: mapStoreStatus(row.status),
      storeCode: row.storeNo,
      storeName: row.brandName,
      subcategoryId: "",
      subcategoryName: row.subcategoryName,
      unitNo: "",
    };
    const existing = existingByStoreNo.get(row.storeNo);
    const saved = existing ? await store.updateStore({ ...input, id: existing.id }) : await store.createStore(input);
    if (saved) {
      await store.setStoreAliases(saved.id, splitFinalStoreAliases(row.searchAliases));
    }
  }

  const afterImport = await store.listStores();
  const importedStoreNos = new Set(finalSurveyStoreRows.map((row) => row.storeNo));
  for (const oldStore of afterImport) {
    if (withdrawnStoreNames.includes(oldStore.brandName) || (!importedStoreNos.has(oldStore.storeCode) && oldStore.status === "active")) {
      await store.updateStoreStatus(oldStore.id, "archived");
    }
  }
  for (const brandName of withdrawnStoreNames) {
    const current = (await store.listStores()).find((item) => item.brandName === brandName);
    if (!current) {
      const category = categories[0];
      const brand = await store.upsertBrand({ mallId, name: brandName });
      await store.createStore({
        areaSqm: 0,
        brandId: brand.id,
        categoryId: category.id,
        chainStore: false,
        contactPhone: "",
        contractEndDate: "",
        contractStartDate: "",
        displayLocation: "已撤店",
        floor: "",
        formCategoryCode: "ARCHIVED",
        managerName: "",
        mallId,
        operationMode: "",
        operatorName: "",
        rentMode: "",
        staffCount: 0,
        status: "archived",
        storeCode: `ARCHIVED-${brandName}`,
        storeName: brandName,
        subcategoryId: "",
        subcategoryName: "已撤店",
        unitNo: "",
      });
    }
  }

  return summarizeFinalSurveyStoreRows(finalSurveyStoreRows);
}

function mapStoreStatus(status: FinalSurveyStoreRow["status"]): SurveyStoreStatus {
  if (status === "停用") return "disabled";
  if (status === "归档") return "archived";
  return "active";
}
