import type { WorkbenchGenerationType } from "../data/types";
import { workbenchToolDefinitions } from "../domain/workbench";

export type WorkbenchInput = Record<string, string>;

export function buildWorkbenchPrompt(type: WorkbenchGenerationType, input: WorkbenchInput): string {
  const tool = workbenchToolDefinitions[type];

  return [
    `你是吕明磊私用的${tool.label}。`,
    `功能说明：${tool.description}`,
    "请根据下面表单信息生成可直接复制到抖音、视频号、小红书、闲鱼、朋友圈和微信的中文内容。",
    renderInput(input),
    "基础要求：真实接地气，像本地运营人说的话，不要像硬广告。",
    "合规要求：不要承诺固定订单、固定曝光、保证成交；不要编造具体店铺名；医疗健康相关表达要稳妥。",
    "推广顺序：公开视频、朋友圈、小红书、闲鱼优先引导 4.9 元基础体检；私聊再推荐 69 元全面体检 + 修改方案；有兴趣后再推荐 39 元 AI 网站工具月卡或代运营陪跑。",
    "格式强约束：只输出一个合法 JSON 对象，不要在 JSON 前后添加解释、标题、代码块或多余文字。",
    "排版强约束：不要使用 Markdown 符号，不要输出 # 标签，不要使用 * 或 ---，每个字段内容要方便直接复制。",
    `JSON 结构：${getWorkbenchOutputStructure(type)}`,
  ].join("\n");
}

export function getWorkbenchOutputStructure(type: WorkbenchGenerationType): string {
  const structures: Record<WorkbenchGenerationType, string> = {
    mealbox_video:
      '{"douyinTitles":["标题1","标题2","标题3","标题4","标题5","标题6","标题7","标题8","标题9","标题10"],"hooks":["开头3秒钩子1","开头3秒钩子2","开头3秒钩子3","开头3秒钩子4","开头3秒钩子5"],"videoScript":"完整短视频口播稿","xiaohongshuPost":"小红书同步文案","momentsPost":"朋友圈同步文案","coverTitles":["封面标题1","封面标题2","封面标题3","封面标题4","封面标题5","封面标题6","封面标题7","封面标题8","封面标题9","封面标题10"],"pinnedComments":["评论区置顶话术1","评论区置顶话术2","评论区置顶话术3"],"dmGuides":["私信引导话术1","私信引导话术2","私信引导话术3"]}',
    promotion_copy:
      '{"videoScript":"抖音或视频号口播稿","xiaohongshuPost":"小红书文案","xianyuTitles":["闲鱼标题1","闲鱼标题2","闲鱼标题3","闲鱼标题4","闲鱼标题5","闲鱼标题6","闲鱼标题7","闲鱼标题8","闲鱼标题9","闲鱼标题10"],"xianyuDetail":"闲鱼详情文案","momentsPosts":["朋友圈文案1","朋友圈文案2","朋友圈文案3"],"privateInviteScripts":["微信私聊邀约话术1","微信私聊邀约话术2","微信私聊邀约话术3","微信私聊邀约话术4","微信私聊邀约话术5"],"objectionReplies":[{"question":"客户异议1","answer":"回复1"},{"question":"客户异议2","answer":"回复2"},{"question":"客户异议3","answer":"回复3"},{"question":"客户异议4","answer":"回复4"},{"question":"客户异议5","answer":"回复5"}]}',
    poster_prompt:
      '{"mainTitles":["主标题1","主标题2","主标题3","主标题4","主标题5","主标题6","主标题7","主标题8","主标题9","主标题10"],"subtitles":["副标题1","副标题2","副标题3","副标题4","副标题5"],"sellingPoints":["卖点1","卖点2","卖点3"],"bottomGuides":["底部引导语1","底部引导语2","底部引导语3","底部引导语4","底部引导语5"],"douyinLayout":"抖音/视频号封面排版建议","xiaohongshuLayout":"小红书封面排版建议","xianyuLayout":"闲鱼主图排版建议","momentsLayout":"朋友圈海报排版建议","imagePrompts":["AI 作图提示词1","AI 作图提示词2","AI 作图提示词3"]}',
    moments_library:
      '{"todayReadyPosts":["适合今天直接发的朋友圈1","适合今天直接发的朋友圈2","适合今天直接发的朋友圈3"],"sevenDayPosts":["第1天朋友圈","第2天朋友圈","第3天朋友圈","第4天朋友圈","第5天朋友圈","第6天朋友圈","第7天朋友圈"],"imageTextIdeas":["配图短句1","配图短句2","配图短句3","配图短句4","配图短句5","配图短句6","配图短句7","配图短句8","配图短句9","配图短句10"],"commentReplies":["评论或私聊回复1","评论或私聊回复2","评论或私聊回复3","评论或私聊回复4","评论或私聊回复5"],"closingScripts":["引导成交话术1","引导成交话术2","引导成交话术3","引导成交话术4","引导成交话术5"]}',
  };

  return structures[type];
}

function renderInput(input: WorkbenchInput): string {
  const lines = Object.entries(input)
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value]) => `${key}：${value}`);

  return lines.length ? ["表单信息：", ...lines].join("\n") : "表单信息：无";
}
