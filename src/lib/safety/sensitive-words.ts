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
  "私信我",
  "私信",
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
  "包你满意",
  "保证有效",
  "百分百",
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
  "永久",
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

const replacementMap: Record<string, string> = {
  VX: "留言",
  V信: "留言",
  v我: "留言",
  加v: "留言了解",
  加VX: "留言了解",
  加微信: "留言了解",
  加我: "留言了解",
  微信: "留言",
  私加: "留言了解",
  私信我: "留言",
  私信: "留言",
  私聊领: "留言获取",
  私信领: "留言获取",
  主页加: "主页了解",
  看主页: "查看主页信息",
  扫码: "按页面指引",
  二维码: "页面信息",
  电话: "咨询入口",
  手机号: "联系方式",
  联系方式: "咨询方式",
  地址私发: "按平台规则咨询地址",
  免费领取: "领取参考资料",
  进群: "参与交流",
  拉群: "参与交流",
  代理: "合作咨询",
  招代理: "合作咨询",
  全网最低: "优惠体验价",
  全城最低: "优惠体验价",
  全城最低价: "优惠体验价",
  最便宜: "价格友好",
  最强: "表现突出",
  权威推荐: "专业建议",
  官方指定: "规范推荐",
  独家秘方: "特色方案",
  祖传秘方: "传统调理方案",
  根治: "日常调理",
  治愈: "改善",
  治好: "改善",
  包好: "需评估",
  包你满意: "体验后再判断是否适合",
  保证有效: "体验因人而异",
  百分百: "体验因人而异",
  百分百有效: "体验因人而异",
  第一: "表现较好",
  最权威: "专业",
  零风险: "需评估风险",
  无风险: "需评估风险",
  无痛: "舒适化",
  不痛: "舒适化",
  不疼: "舒适化",
  无创: "温和",
  绝对安全: "需专业评估",
  无副作用: "反应因人而异",
  立即见效: "体验因人而异",
  马上见效: "体验因人而异",
  一次见效: "体验因人而异",
  永久: "持续养护",
  永久改善: "持续养护",
  彻底改善: "逐步改善",
  药到病除: "因人而异",
  疗效保证: "效果因人而异",
  特效: "针对性",
  立竿见影: "体验因人而异",
  最有效: "适合时更有帮助",
};

export type SensitiveCheckResult = {
  detectedWords: string[];
  hasRisk: boolean;
  message: string;
  suggestions: string[];
};

export type SensitiveReplacement = {
  from: string;
  to: string;
};

export type SensitiveReplacementResult = {
  content: string;
  replacements: SensitiveReplacement[];
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

export function replaceSensitiveWords(content: string): SensitiveReplacementResult {
  const replacements = sensitiveWords
    .map((word) => ({ from: word, index: content.indexOf(word), length: word.length, to: replacementMap[word] ?? defaultSuggestions[0] }))
    .filter((match) => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.length - left.length)
    .reduce<Array<{ from: string; index: number; length: number; to: string }>>((matches, match) => {
      const previous = matches[matches.length - 1];
      if (previous && match.index < previous.index + previous.length) {
        return matches;
      }
      matches.push(match);
      return matches;
    }, [])
    .map(({ from, to }) => ({ from, to }));

  const safeContent = [...replacements]
    .sort((left, right) => right.from.length - left.from.length)
    .reduce((current, replacement) => {
      const withUnderstand = `${replacement.from}了解`;
      if (replacement.to.endsWith("了解") && current.includes(withUnderstand)) {
        return current.split(withUnderstand).join(replacement.to);
      }
      return current.split(replacement.from).join(replacement.to);
    }, content);

  return {
    content: safeContent,
    replacements,
  };
}
