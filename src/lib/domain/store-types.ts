export const canonicalStoreTypes = [
  "中医馆 / 中医诊所",
  "口腔门诊",
  "推拿按摩SPA馆",
  "美容美业",
  "宠物医院",
  "综合门诊",
  "少儿推拿",
  "餐饮门店",
  "儿童教培",
] as const;

export type CanonicalStoreType = (typeof canonicalStoreTypes)[number];

export const sourceChannels = ["闲鱼", "微信", "小红书", "抖音", "快手", "其他"] as const;
export type SourceChannel = (typeof sourceChannels)[number];

const legacyStoreTypeMap: Record<string, CanonicalStoreType> = {
  "中医馆 / 中医诊所": "中医馆 / 中医诊所",
  "推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆": "推拿按摩SPA馆",
  "推拿馆 / 理疗馆 / 艾灸馆 / SPA馆": "推拿按摩SPA馆",
  "口腔门诊": "口腔门诊",
  "医院科室 / 综合门诊": "综合门诊",
  "健康管理中心 / 体检中心": "综合门诊",
  "宠物医院": "宠物医院",
  "其他本地健康门店": "综合门诊",
};

const placeholders: Record<CanonicalStoreType, { projectName: string; targetCustomer: string }> = {
  "中医馆 / 中医诊所": {
    projectName: "例如艾灸、拔罐、刮痧、三伏贴、肩颈调理",
    targetCustomer: "例如上班族、中老年人、附近居民、体质偏寒人群",
  },
  "口腔门诊": {
    projectName: "例如洁牙、儿牙检查、正畸咨询、种植咨询、补牙",
    targetCustomer: "例如宝妈、上班族、学生、牙齿敏感人群、附近居民",
  },
  "推拿按摩SPA馆": {
    projectName: "例如肩颈放松、足疗、精油SPA、头疗、腰背放松",
    targetCustomer: "例如上班族、经常久坐人群、附近居民、情侣、朋友聚会",
  },
  "美容美业": {
    projectName: "例如皮肤管理、美甲、美睫、美体、头疗养发",
    targetCustomer: "例如女性客户、上班族、宝妈、附近居民、爱美人群",
  },
  "宠物医院": {
    projectName: "例如疫苗、驱虫、体检、绝育咨询、洗护美容",
    targetCustomer: "例如新手养宠人群、猫主人、狗主人、附近宠物家庭",
  },
  "综合门诊": {
    projectName: "例如体检、报告解读、慢病随访、基础门诊、健康咨询",
    targetCustomer: "例如附近居民、中老年人、上班族、家庭客户",
  },
  "少儿推拿": {
    projectName: "例如积食调理、睡眠调理、鼻部不适调理、体质养护",
    targetCustomer: "例如宝妈、3-12岁儿童家长、附近家庭、幼儿园家长",
  },
  "餐饮门店": {
    projectName: "例如双人餐、招牌菜、火锅、烧烤、包间聚餐、外卖套餐",
    targetCustomer: "例如上班族、家庭聚餐、朋友聚会、附近居民、情侣",
  },
  "儿童教培": {
    projectName: "例如试听课、少儿口才、少儿编程、美术、书法、托管",
    targetCustomer: "例如宝妈、幼儿园家长、小学生家长、附近家庭",
  },
};

const medicalStoreTypes = new Set<CanonicalStoreType>([
  "中医馆 / 中医诊所",
  "口腔门诊",
  "宠物医院",
  "综合门诊",
  "少儿推拿",
]);

export function normalizeStoreType(value: string): CanonicalStoreType {
  const normalized = value.trim();
  if ((canonicalStoreTypes as readonly string[]).includes(normalized)) {
    return normalized as CanonicalStoreType;
  }
  return legacyStoreTypeMap[normalized] ?? "综合门诊";
}

export function normalizeSourceChannel(value?: string | null): SourceChannel {
  return (sourceChannels as readonly string[]).includes(value || "") ? (value as SourceChannel) : "其他";
}

export function getStoreTypePlaceholders(storeType: string) {
  return placeholders[normalizeStoreType(storeType)];
}

export function getIndustrySafetyRules(storeType: string): string {
  const normalized = normalizeStoreType(storeType);
  if (medicalStoreTypes.has(normalized)) {
    return "行业表达：禁止根治、保证疗效、最高级、第一、包好、永不复发、绝对安全等治疗或结果承诺；优先使用体验、了解、建议、调理、养护、到店沟通、根据实际情况选择。";
  }
  if (normalized === "美容美业") {
    return "行业表达：禁止永久、立刻变美、100%有效、彻底解决和医美夸大承诺；优先使用改善体验、日常护理、皮肤管理、根据个人情况选择。";
  }
  if (normalized === "餐饮门店") {
    return "行业表达：禁止全城第一、最好吃、必吃第一名、绝对干净等夸大宣传；优先使用适合聚餐、招牌菜、环境体验、口味偏好、到店体验。";
  }
  if (normalized === "儿童教培") {
    return "行业表达：禁止保证提分、保证升学、一定有效、快速逆袭、名师保过；优先使用试听体验、课程了解、学习兴趣、课堂反馈、根据孩子情况选择。";
  }
  return "行业表达：禁止保证效果、绝对、第一、永久等夸大承诺；优先描述真实服务、到店体验和根据个人情况选择。";
}
