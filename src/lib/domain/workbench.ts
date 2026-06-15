import type { WorkbenchGenerationType } from "../data/types";

const priceExposureOptions = [
  "不显示具体价格",
  "只写基础体检/先看一下",
  "显示 4.9 元基础体检",
  "显示 69 元全面体检 + 修改方案",
  "显示 39 元 AI 网站工具月卡",
  "显示全部价格",
  "根据补充信息决定",
];

export type WorkbenchFieldDefinition = {
  defaultValue?: string;
  label: string;
  name: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  type?: "input" | "select" | "textarea";
};

export const workbenchToolDefinitions: Record<WorkbenchGenerationType, { label: string; description: string }> = {
  mealbox_video: {
    label: "午休门店体检视频助手",
    description: "生成“医院午休 + 本地门店线上体检”短视频脚本。",
  },
  promotion_copy: {
    label: "推广文案助手",
    description: "生成 4.9 基础体检、69 全面体检、AI 月卡和代运营陪跑推广文案。",
  },
  poster_prompt: {
    label: "海报文案与提示词助手",
    description: "生成海报标题、卖点、排版建议和 AI 作图提示词。",
  },
  moments_library: {
    label: "朋友圈长期宣传文案库",
    description: "生成一组可以连续发布的朋友圈宣传文案和承接话术。",
  },
};

export const workbenchToolTypes = Object.keys(workbenchToolDefinitions) as WorkbenchGenerationType[];

export const workbenchFieldDefinitions: Record<WorkbenchGenerationType, WorkbenchFieldDefinition[]> = {
  mealbox_video: [
    { defaultValue: "今天医院食堂一荤一素，饭菜看着一般", label: "今日饭菜描述", name: "mealDescription", placeholder: "例如医院食堂一荤一素", type: "input" },
    {
      label: "店铺行业",
      name: "storeType",
      defaultValue: "本地生活门店",
      options: ["中医馆", "推拿馆", "口腔门诊", "健康管理", "宠物医院", "儿童教培", "餐饮店", "本地生活门店", "其他"],
      type: "select",
    },
    { defaultValue: "美团", label: "检查平台", name: "targetPlatform", options: ["美团", "大众点评", "抖音", "小红书", "闲鱼", "朋友圈", "其他"], type: "select" },
    {
      label: "店铺主要问题",
      name: "storeIssue",
      defaultValue: "页面没有信任感",
      options: ["标题不好", "团单设计差", "主图不吸引人", "评价少", "价格乱", "页面没有信任感", "没有私域承接", "内容太硬广", "平台定位不清楚", "其他"],
      type: "select",
    },
    { defaultValue: "抖音/视频号", label: "视频发布平台", name: "publishPlatform", options: ["抖音/视频号", "抖音", "视频号", "小红书", "朋友圈", "多平台同步"], type: "select" },
    { defaultValue: "真实接地气", label: "内容风格", name: "contentStyle", options: ["真实接地气", "轻松吐槽", "专业顾问", "老板能听懂", "医院打工人午休副业风"], type: "select" },
    {
      defaultValue: "不显示具体价格",
      label: "价格露出方式",
      name: "priceExposure",
      options: priceExposureOptions,
      type: "select",
    },
    { label: "补充信息", name: "extraInfo", placeholder: "例如店铺页面问题、你想重点说的话", required: false, type: "textarea" },
  ],
  promotion_copy: [
    {
      label: "推广产品",
      name: "product",
      defaultValue: "本地门店线上运营诊断",
      options: ["本地门店线上运营诊断", "4.9 元基础体检", "69 元全面体检 + 修改方案", "39 元 AI 网站工具月卡", "AI 网站工具免费三天试用", "美团点评代运营", "小红书本地运营陪跑", "抖音本地生活陪跑", "闲鱼获客陪跑", "朋友圈私域成交陪跑"],
      type: "select",
    },
    {
      label: "目标客户",
      name: "targetCustomer",
      defaultValue: "本地生活门店老板",
      options: ["中医馆老板", "推拿馆老板", "口腔门诊", "健康管理中心", "宠物医院", "儿童教培机构", "本地生活门店老板", "其他"],
      type: "select",
    },
    {
      label: "客户痛点",
      name: "customerPain",
      defaultValue: "不知道线上店铺哪里有问题",
      options: ["没人咨询", "团单没人买", "页面乱", "评价少", "不会发内容", "不知道怎么获客", "投流没效果", "朋友圈不会发", "私域不会成交", "不知道线上店铺哪里有问题", "其他"],
      type: "select",
    },
    { defaultValue: "朋友圈", label: "发布平台", name: "publishPlatform", options: ["抖音", "视频号", "小红书", "闲鱼", "朋友圈", "微信群", "微信私聊", "多平台同步"], type: "select" },
    {
      defaultValue: "根据补充信息决定",
      label: "价格露出方式",
      name: "priceExposure",
      options: priceExposureOptions,
      type: "select",
    },
    { label: "补充信息", name: "extraInfo", placeholder: "例如要强调免费三天试用、先做基础体检", required: false, type: "textarea" },
  ],
  poster_prompt: [
    { defaultValue: "网站/代运营推广", label: "海报类别", name: "posterCategory", options: ["午休门店体检", "儿童教培宣传", "网站/代运营推广"], type: "select" },
    { defaultValue: "朋友圈海报", label: "使用场景", name: "usageScene", options: ["抖音封面", "视频号封面", "小红书封面", "闲鱼主图", "朋友圈海报", "微信群宣传图", "多平台通用"], type: "select" },
    {
      label: "目标客户",
      name: "targetCustomer",
      defaultValue: "本地门店老板",
      options: ["中医馆老板", "推拿馆老板", "口腔门诊", "健康管理中心", "宠物医院", "儿童教培家长", "儿童教培机构", "本地门店老板", "其他"],
      type: "select",
    },
    { defaultValue: "页面乱，客户看不懂", label: "核心痛点", name: "corePain", placeholder: "例如没人咨询、课程招生难、页面乱", type: "input" },
    { defaultValue: "基础体检", label: "主推内容", name: "mainContent", placeholder: "例如基础体检、儿童托管招生", type: "input" },
    { defaultValue: "真实接地气", label: "设计风格", name: "designStyle", options: ["真实接地气", "醒目大字", "绿色底图", "白底黑字", "强对比", "专业顾问风", "生活化风", "儿童活泼风", "本地门店风"], type: "select" },
    {
      defaultValue: "根据补充信息决定",
      label: "价格露出方式",
      name: "priceExposure",
      options: priceExposureOptions,
      type: "select",
    },
    { label: "补充信息", name: "extraInfo", placeholder: "例如颜色、比例、不要出现的元素", required: false, type: "textarea" },
  ],
  moments_library: [
    {
      label: "宣传主题",
      name: "topic",
      defaultValue: "本地门店线上运营诊断",
      options: ["4.9 元基础体检", "69 元全面体检 + 修改方案", "39 元 AI 网站工具月卡", "AI 网站工具免费三天试用", "美团点评代运营", "小红书本地运营陪跑", "抖音本地生活陪跑", "闲鱼获客陪跑", "朋友圈私域成交陪跑", "本地门店线上运营诊断", "综合宣传"],
      type: "select",
    },
    { defaultValue: "本地生活门店老板", label: "目标客户", name: "targetCustomer", options: ["中医馆老板", "推拿馆老板", "口腔门诊", "健康管理中心", "宠物医院", "儿童教培机构", "本地生活门店老板", "个体商家", "其他"], type: "select" },
    { defaultValue: "朋友圈日常分享", label: "文案风格", name: "copyStyle", options: ["真实接地气", "朋友圈日常分享", "轻微成交感", "专业顾问感", "老板能看懂", "不硬广", "带一点危机感", "案例拆解风"], type: "select" },
    { defaultValue: "朋友圈长期种草", label: "发布目的", name: "publishGoal", options: ["引导咨询", "引导做基础体检", "引导做全面体检", "引导试用 AI 网站工具", "引导代运营合作", "引导私聊", "朋友圈长期种草"], type: "select" },
    {
      defaultValue: "根据补充信息决定",
      label: "价格露出方式",
      name: "priceExposure",
      options: priceExposureOptions,
      type: "select",
    },
    { label: "补充信息", name: "extraInfo", placeholder: "例如最近午休看店、想推广免费三天试用", required: false, type: "textarea" },
  ],
};
