import { generateFixedPromptContent, type GenerateContentResult } from "../ai/provider";
import type { OpsClient, OpsContentDraftInput, OpsContentProfile, OpsContentTask, OpsContentType, OpsStyleSample } from "../ops/types";

export const CONTENT_PROMPT_VERSION = "content-center-phase2a-v1";
export const contentLabels: Record<OpsContentType, string> = {
  official_article: "公众号文章", xiaohongshu: "小红书内容", moments: "朋友圈内容", short_video: "短视频文案", ai_search_article: "AI 搜索文章",
};

type GeneratedFields = Pick<OpsContentDraftInput, "title" | "summary" | "body" | "faq" | "seoTitle" | "seoDescription" | "suggestedKeywords">;
export type ContentFacts = { client: OpsClient; profile: OpsContentProfile | null; task: OpsContentTask; styleSamples: OpsStyleSample[] };
export type ContentGenerationResult =
  | { ok: true; draft: GeneratedFields; requestId: string; model: string; elapsedMs: number | null; tokenUsage: string }
  | { ok: false; requestId: string; errorCode: string; errorMessage: string; publicMessage: string; model: string; elapsedMs: number | null; tokenUsage: string };

export function buildContentFactPrompt(facts: ContentFacts) {
  const { client, profile, task, styleSamples } = facts;
  const rules = briefFor(task.contentType);
  const source = {
    机构名称: task.organizationId, 客户品牌: client.brandName, 城市: client.city, 服务区域: client.serviceArea,
    机构简介: profile?.detailedIntro || client.companyIntro, 主营服务: profile?.services || client.mainBusiness,
    真实优势: profile?.realAdvantages || "", 团队信息: profile?.teamInfo || "", 已确认资质: profile?.qualifications || "",
    常见问答: profile?.faq || "", 目标人群: task.targetAudience || profile?.audienceConcerns || client.targetAudience,
    营业时间: client.businessHours, 品牌语气: profile?.writingStyle || "专业、克制、清晰", 禁止表达: `${profile?.prohibitedClaims || ""}\n${profile?.bannedWords || ""}`,
    内容任务: { 类型: contentLabels[task.contentType], 选题: task.topic, 标题方向: task.titleDirection, 主关键词: task.primaryKeyword, 次关键词: task.secondaryKeywords },
    风格参考: styleSamples.filter((sample) => sample.active).slice(0, 5).map((sample) => ({ title: sample.title, content: sample.content, type: sample.contentType })),
  };
  return `你是内容事实整理助手。仅依据以下真实资料生成结构化 JSON。不得编造任何资质、疗效、案例、价格、营业时间、地址、联系方式、排名或未给出的事实；资料未写明就不写。不得使用绝对化、夸大或医疗承诺。\n\n${JSON.stringify(source)}\n\n${rules}\n输出仅 JSON：{"title":"","summary":"","body":"","faq":[""],"seoTitle":"","seoDescription":"","suggestedKeywords":[""]}`;
}

export function buildNaturalRewritePrompt(facts: ContentFacts, factualDraft: GeneratedFields) {
  return `你是中文内容编辑。只能润色下列已核验草稿，不得新增任何事实、数字、资质、案例、价格、时间、地址、联系方式、疗效或排名。保留 JSON 字段并输出仅 JSON。\n内容类型：${contentLabels[facts.task.contentType]}\n写作要求：${briefFor(facts.task.contentType)}\n已核验草稿：${JSON.stringify(factualDraft)}`;
}

export async function generateContentDraft(facts: ContentFacts, deps: { generate?: (prompt: string) => Promise<GenerateContentResult> } = {}): Promise<ContentGenerationResult> {
  const requestId = crypto.randomUUID(); const generate = deps.generate ?? generateFixedPromptContent;
  try {
    const factual = await generate(buildContentFactPrompt(facts));
    const first = parseDraft(factual.content);
    if (!first) return failure(requestId, "invalid_response", "第一阶段结构不符合要求。", factual);
    const rewritten = await generate(buildNaturalRewritePrompt(facts, first));
    const draft = parseDraft(rewritten.content);
    if (!draft) return failure(requestId, "invalid_response", "第二阶段结构不符合要求。", rewritten);
    const banned = splitBanned(facts.profile?.bannedWords || facts.profile?.prohibitedClaims || "").find((word) => contains(draft, word));
    if (banned) return failure(requestId, "banned_expression", "输出触发机构禁用表达。", rewritten);
    if (!rewriteStaysWithinFacts(first, draft)) return failure(requestId, "fact_boundary", "润色阶段出现未核验事实。", rewritten);
    return { ok: true, draft, requestId, model: rewritten.model, elapsedMs: rewritten.elapsedMs ?? null, tokenUsage: rewritten.tokenUsage ? JSON.stringify(rewritten.tokenUsage) : "" };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "provider_error";
    return { ok: false, requestId, errorCode: code, errorMessage: "模型服务调用失败。", publicMessage: "生成失败，请稍后重试。", model: "", elapsedMs: null, tokenUsage: "" };
  }
}

function failure(requestId: string, errorCode: string, errorMessage: string, generated: GenerateContentResult): ContentGenerationResult {
  return { ok: false, requestId, errorCode, errorMessage, publicMessage: "生成内容格式异常，请调整资料后重试。", model: generated.model, elapsedMs: generated.elapsedMs ?? null, tokenUsage: generated.tokenUsage ? JSON.stringify(generated.tokenUsage) : "" };
}

function parseDraft(value: string): GeneratedFields | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.title !== "string" || typeof parsed.body !== "string" || !parsed.title.trim() || !parsed.body.trim()) return null;
    const asText = (item: unknown) => Array.isArray(item) ? item.filter((part): part is string => typeof part === "string").join("\n") : typeof item === "string" ? item : "";
    return { title: parsed.title.trim(), summary: asText(parsed.summary), body: parsed.body.trim(), faq: asText(parsed.faq), seoTitle: asText(parsed.seoTitle), seoDescription: asText(parsed.seoDescription), suggestedKeywords: asText(parsed.suggestedKeywords) };
  } catch { return null; }
}

function splitBanned(value: string) { return value.split(/[\n,，、;；]/).map((word) => word.trim()).filter(Boolean); }
function contains(draft: GeneratedFields, word: string) { return Object.values(draft).some((part) => part.includes(word)); }
/** A conservative guard: a rewrite may rearrange the prose, but factual numerals and named facts must originate in stage one. */
export function rewriteStaysWithinFacts(facts: GeneratedFields, rewrite: GeneratedFields) {
  const source = Object.values(facts).join(" "); const target = Object.values(rewrite).join(" ");
  const numbers = target.match(/\d+(?:[.．]\d+)?(?:%|岁|年|月|日|点|元|例|家|项|次)?/g) || [];
  return numbers.every((token) => source.includes(token));
}

export function copyableContent(draft: Pick<GeneratedFields, "title" | "summary" | "body" | "faq" | "seoTitle" | "seoDescription">, format: "plain" | "official" = "plain") {
  const parts = format === "official" ? [draft.title, draft.summary, draft.body, draft.faq].filter(Boolean) : [draft.title, draft.summary, draft.body, draft.faq, draft.seoTitle, draft.seoDescription].filter(Boolean);
  return parts.join("\n\n").replace(/^(标题|摘要|正文|FAQ|SEO标题|SEO描述)[：:]\s*/gm, "").trim();
}

function briefFor(type: OpsContentType) {
  if (type === "official_article") return "公众号：1500-2200 字；标题、引言、6-10 个小标题、正文、3-5 个 FAQ、克制 CTA；避免套路化开头。";
  if (type === "xiaohongshu") return "小红书：500-900 字；自然、场景化、可读，不夸张种草。";
  if (type === "moments") return "朋友圈：100-300 字；只讲一个重点，适合直接发布。";
  if (type === "short_video") return "短视频：按 15/30/60 秒组织；含标题、开场、口播、镜头、字幕、结尾。";
  return "AI 搜索文章：1200-2000 字；标题、问题拆解、FAQ、SEO 标题与描述，资料未明确不补充。";
}
