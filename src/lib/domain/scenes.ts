export const sceneDefinitions = {
  xiaohongshu: {
    label: "小红书文案",
  },
  moments: {
    label: "朋友圈文案",
  },
  official_account: {
    label: "公众号文案",
  },
  meituan_dianping: {
    label: "美团 / 点评团单文案",
  },
  review_reply: {
    label: "点评好评话术",
  },
  private_domain: {
    label: "私域成交话术",
  },
} as const;

export type SceneKey = keyof typeof sceneDefinitions;

export const allSceneKeys = Object.keys(sceneDefinitions) as SceneKey[];

