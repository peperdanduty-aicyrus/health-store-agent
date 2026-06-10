const sensitiveWords = [
  "根治",
  "治愈",
  "包好",
  "百分百有效",
  "第一",
  "最权威",
  "无副作用",
  "立即见效",
  "永久改善",
  "疗效保证",
  "特效",
  "立竿见影",
  "最有效",
  "全城最低价",
];

const defaultSuggestions = [
  "日常调理",
  "养护建议",
  "体验因人而异",
  "建议到店评估",
  "是否适合需评估",
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
