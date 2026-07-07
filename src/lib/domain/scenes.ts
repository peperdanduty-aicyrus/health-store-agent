export const sceneDefinitions = {
  xiaohongshu: {
    label: "小红书文案",
    description: "生成标题、正文、标签和评论区引导，适合门店日常种草发布。",
  },
  moments: {
    label: "朋友圈文案",
    description: "生成老板、店长、前台都能直接发的朋友圈内容，减少硬广感。",
  },
  official_account: {
    label: "公众号文案",
    description: "生成项目介绍、活动通知、门店动态、科普说明等中短篇内容。",
  },
  meituan_dianping: {
    label: "美团 / 点评团单文案",
    description: "生成团单标题、副标题、项目亮点、适合人群和购买须知。",
  },
  review_reply: {
    label: "点评好评话术",
    description: "生成自然真实的好评参考和商家回复，方便维护评价区。",
  },
  private_domain: {
    label: "私域成交话术",
    description: "生成微信咨询、预约引导、老客回访、活动转化等沟通话术。",
  },
  douyin_kuaishou: {
    label: "抖音 / 快手短视频文案",
    description: "生成短视频标题、15秒和30秒脚本、口播、字幕和评论区引导。",
  },
} as const;

export type SceneKey = keyof typeof sceneDefinitions;

export const allSceneKeys = Object.keys(sceneDefinitions) as SceneKey[];
