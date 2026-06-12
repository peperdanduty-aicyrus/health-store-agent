const sensitiveWords = [
  "微信",
  "VX",
  "V信",
  "v我",
  "加我",
  "加微信",
  "加v",
  "加VX",
  "私加",
  "私聊领",
  "私信领",
  "主页加",
  "看主页",
  "扫码",
  "二维码",
  "电话",
  "手机号",
  "联系方式",
  "地址私发",
  "免费领取",
  "进群",
  "拉群",
  "代理",
  "招代理",
  "全网最低",
  "全城最低",
  "最便宜",
  "最强",
  "权威推荐",
  "官方指定",
  "独家秘方",
  "祖传秘方",
  "根治",
  "治愈",
  "治好",
  "包好",
  "百分百有效",
  "第一",
  "最权威",
  "零风险",
  "无风险",
  "无痛",
  "不痛",
  "不疼",
  "无创",
  "绝对安全",
  "无副作用",
  "立即见效",
  "马上见效",
  "一次见效",
  "永久改善",
  "彻底改善",
  "药到病除",
  "疗效保证",
  "特效",
  "立竿见影",
  "最有效",
  "全城最低价",
];

const defaultSuggestions = [
  "日常调理",
  "养护建议",
  "舒适化检查",
  "麻醉辅助下检查",
  "体验因人而异",
  "建议到店评估",
  "是否适合需评估",
  "具体方案以医生评估为准",
  "想了解可以留言",
  "科普参考",
  "具体情况因人而异",
  "由专业人员判断",
];

export type SensitiveCheckResult = {
  detectedWords: string[];
  hasRisk: boolean;
  message: string;
  suggestions: string[];
};

export function scanSensitiveWords(content: string): SensitiveCheckResult {
  const detectedWords = sensitiveWords
    .map((word) => ({ word, index: content.indexOf(word) }))
    .filter((match) => match.index >= 0)
    .sort((left, right) => left.index - right.index)
    .map((match) => match.word);

  if (detectedWords.length === 0) {
    return {
      detectedWords: [],
      hasRisk: false,
      message: "敏感词风险检查：未发现明显高风险表达，请发布前结合实际情况人工确认。",
      suggestions: [],
    };
  }

  return {
    detectedWords,
    hasRisk: true,
    message: `检测到可能存在风险表达：${detectedWords.join("、")}。建议替换为：${defaultSuggestions.join("、")}。`,
    suggestions: defaultSuggestions,
  };
}
