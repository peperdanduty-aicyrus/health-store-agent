"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { markWorkbenchCopied } from "@/app/lvminglei/actions";

type StructuredValue = string | number | boolean | null | StructuredValue[] | { [key: string]: StructuredValue };

const labels: Record<string, string> = {
  answer: "回复",
  background: "背景环境",
  bottomGuides: "底部引导语",
  bottomGuide: "底部引导语",
  closingScripts: "引导成交话术",
  caution: "注意事项",
  commentReplies: "评论/私聊回复",
  colors: "颜色",
  coverTitles: "封面标题",
  conversionPosts: "成交转化型",
  dailyRecordPosts: "日常记录型",
  dmGuides: "私信引导话术",
  douyinDmScripts: "抖音私信承接话术",
  douyinHooks: "抖音开头 3 秒钩子",
  douyinLayout: "抖音/视频号排版建议",
  douyinPinnedComments: "抖音评论区置顶话术",
  douyinScripts: "抖音口播稿",
  douyinTitles: "抖音/视频号标题",
  duration: "时长",
  endingGuides: "结尾引导话术",
  hooks: "开头 3 秒钩子",
  imagePrompts: "AI 作图提示词",
  imagePrompt: "AI 作图提示词",
  imageTextIdeas: "朋友圈配图短句",
  layoutAdvice: "当前使用场景排版建议",
  mainTitles: "主标题",
  mainTitle: "大标题",
  momentsLayout: "朋友圈海报排版建议",
  momentsPost: "朋友圈同步文案",
  momentsPosts: "朋友圈文案",
  momentsHumanPosts: "朋友圈真人日常版",
  momentsCommentReplies: "朋友圈评论/私聊承接话术",
  momentsConversionPosts: "朋友圈成交引导版",
  momentsImageTextIdeas: "朋友圈配图短句",
  momentsProblemObservationPosts: "朋友圈问题观察版",
  momentsSoftPromotionPosts: "朋友圈轻度宣传版",
  name: "名称",
  objectionReplies: "客户异议回复",
  openingShotIdeas: "开头 3 秒画面建议",
  openingShots: "开头 3 秒画面建议",
  pinnedComments: "评论区置顶话术",
  posterCopySets: "海报文案整套",
  privateChatPosts: "私聊承接型",
  privateInviteScripts: "微信私聊邀约话术",
  problemObservationPosts: "问题观察型",
  question: "问题",
  ratio: "比例",
  screenRecordingScript: "手机录屏讲解话术",
  sellingPoints: "海报三条卖点",
  sellingPoint1: "卖点1",
  sellingPoint2: "卖点2",
  sellingPoint3: "卖点3",
  sevenDayPosts: "适合连续 7 天发的朋友圈",
  shortVideoLifeScript: "抖音/视频号生活切入版",
  shortVideoProblemScript: "抖音/视频号问题拆解版",
  shot: "镜头",
  softPromotionPosts: "轻度宣传型",
  storyboard: "拍摄分镜脚本",
  style: "风格",
  subtitle: "副标题",
  subtitles: "副标题",
  todayReadyPosts: "适合今天直接发的朋友圈",
  textArea: "文字区域",
  usageScene: "使用场景",
  videoScript: "短视频口播稿",
  videoChannelCommentReplies: "视频号评论区承接话术",
  videoChannelMomentsPosts: "视频号朋友圈同步文案",
  videoChannelScripts: "视频号口播稿",
  videoChannelTitles: "视频号标题",
  videoTitles: "视频标题",
  visual: "画面",
  visualSubject: "画面主体",
  voiceover: "口播/字幕",
  voiceoverScript: "口播稿",
  wechatFirstInvites: "首次私聊邀约话术",
  wechatFollowUps: "客户没回复的追问话术",
  wechatGroupActivityPosts: "微信群活动引导文案",
  wechatGroupConsultReplies: "群内有人咨询后的回复",
  wechatGroupShortPosts: "微信群短文案",
  wechatInterestReplies: "客户感兴趣后的承接话术",
  xianyuDetail: "闲鱼详情文案",
  xianyuDetails: "闲鱼详情文案",
  xianyuChatReplies: "闲鱼私聊回复话术",
  xianyuHooks: "闲鱼首句钩子",
  xianyuLayout: "闲鱼主图排版建议",
  xianyuTitles: "闲鱼标题",
  xiaohongshuLayout: "小红书封面排版建议",
  xiaohongshuPost: "小红书文案",
  xiaohongshuPosts: "小红书正文",
  xiaohongshuCommentGuides: "小红书评论区引导",
  xiaohongshuDmScripts: "小红书私信承接话术",
  xiaohongshuTitles: "小红书标题",
  xiaohongshuSoftPost: "小红书种草版",
  xiaohongshuConsultPost: "小红书引导咨询版",
};

export function WorkbenchStructuredResult({
  content,
  generationId,
  inputSummary,
}: {
  content: string;
  generationId?: string;
  inputSummary?: Record<string, string>;
}) {
  const parsed = filterStructuredContentForInput(parseStructuredContent(content), inputSummary);
  const fullText = parsed ? formatStructuredContent(parsed) : content;
  const [copiedKey, setCopiedKey] = useState("");
  const [, startTransition] = useTransition();

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? "" : current)), 1600);
    if (generationId) {
      startTransition(() => {
        void markWorkbenchCopied(generationId);
      });
    }
  }

  return (
    <section className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">生成结果</p>
        <CopyButton copied={copiedKey === "full"} label="复制全文" onCopy={() => copyText(fullText, "full")} />
      </div>
      {inputSummary ? <InputSummary inputSummary={inputSummary} /> : null}
      {parsed ? (
        <div className="mt-4 grid gap-4">
          {Object.entries(parsed).map(([key, value]) => (
            <ResultSection copiedKey={copiedKey} key={key} onCopy={copyText} sectionKey={key} value={value} />
          ))}
        </div>
      ) : (
        <pre className="mt-3 select-text whitespace-pre-wrap text-sm leading-7 text-ink/75">{content}</pre>
      )}
    </section>
  );
}

export function filterStructuredContentForInput(
  parsed: Record<string, StructuredValue> | null,
  inputSummary?: Record<string, string>,
): Record<string, StructuredValue> | null {
  if (!parsed || !inputSummary || inputSummary.generationType !== "promotion_copy") {
    return parsed;
  }
  const platform = inputSummary.publishPlatform || "朋友圈";
  if (platform === "多平台同步") {
    return parsed;
  }
  const allowed = promotionKeysForPlatform(platform);
  return Object.fromEntries(Object.entries(parsed).filter(([key]) => allowed.includes(key)));
}

function promotionKeysForPlatform(platform: string): string[] {
  const map: Record<string, string[]> = {
    "朋友圈": ["momentsHumanPosts", "momentsProblemObservationPosts", "momentsSoftPromotionPosts", "momentsImageTextIdeas", "momentsCommentReplies"],
    "抖音": ["douyinTitles", "douyinHooks", "douyinScripts", "douyinPinnedComments", "douyinDmScripts"],
    "视频号": ["videoChannelTitles", "videoChannelScripts", "videoChannelMomentsPosts", "videoChannelCommentReplies"],
    "小红书": ["xiaohongshuTitles", "xiaohongshuPosts", "xiaohongshuCommentGuides", "xiaohongshuDmScripts"],
    "闲鱼": ["xianyuTitles", "xianyuDetails", "xianyuHooks", "xianyuChatReplies"],
    "微信私聊": ["wechatFirstInvites", "wechatInterestReplies", "wechatFollowUps", "objectionReplies"],
    "微信群": ["wechatGroupShortPosts", "wechatGroupActivityPosts", "wechatGroupConsultReplies"],
  };

  return map[platform] || map["朋友圈"];
}

function ResultSection({
  copiedKey,
  onCopy,
  sectionKey,
  value,
}: {
  copiedKey: string;
  onCopy: (text: string, key: string) => void;
  sectionKey: string;
  value: StructuredValue;
}) {
  const name = labelFor(sectionKey);

  if (Array.isArray(value)) {
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <CopyButton copied={copiedKey === sectionKey} label={copyGroupLabel(sectionKey, name)} onCopy={() => onCopy(renderValue(value), sectionKey)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((item, index) => (
            <ArrayItem
              copiedKey={copiedKey}
              item={item}
              itemKey={`${sectionKey}-${index}`}
              key={`${sectionKey}-${index}`}
              onCopy={onCopy}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <CopyButton copied={copiedKey === sectionKey} label="复制" onCopy={() => onCopy(renderValue(value), sectionKey)} />
      </div>
      <div className="select-text whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-7 text-ink/75">{renderValue(value)}</div>
    </div>
  );
}

function ArrayItem({
  copiedKey,
  item,
  itemKey,
  onCopy,
}: {
  copiedKey: string;
  item: StructuredValue;
  itemKey: string;
  onCopy: (text: string, key: string) => void;
}) {
  if (item && !Array.isArray(item) && typeof item === "object") {
    return (
      <div className="rounded-md bg-white p-3 text-sm leading-6 text-ink/75">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-medium text-ink">{fieldTitle(item)}</span>
          <CopyButton copied={copiedKey === itemKey} label="复制本条" onCopy={() => onCopy(renderValue(item), itemKey)} />
        </div>
        <div className="grid gap-2">
          {Object.entries(item).map(([key, value]) => (
            <div className="flex items-start justify-between gap-3 rounded-md bg-paper px-3 py-2" key={`${itemKey}-${key}`}>
              <span className="select-text whitespace-pre-wrap">{renderFieldLine(key, value)}</span>
              <CopyButton copied={copiedKey === `${itemKey}-${key}`} label="复制" onCopy={() => onCopy(renderFieldLine(key, value), `${itemKey}-${key}`)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-12 items-start justify-between gap-3 rounded-md bg-white p-3 text-sm leading-6 text-ink/75">
      <span className="select-text">{renderValue(item)}</span>
      <CopyButton copied={copiedKey === itemKey} label="复制" onCopy={() => onCopy(renderValue(item), itemKey)} />
    </div>
  );
}

function InputSummary({ inputSummary }: { inputSummary: Record<string, string> }) {
  const items = [
    ["推广产品", inputSummary.product],
    ["目标客户", inputSummary.targetCustomer],
    ["客户痛点", inputSummary.customerPain],
    ["使用场景", inputSummary.usageScene],
    ["发布平台", inputSummary.publishPlatform || inputSummary.targetPlatform],
    ["价格露出方式", inputSummary.priceExposure],
  ].filter(([, value]) => value);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <span className="rounded-md border border-ink/10 bg-white px-3 py-1.5 text-xs text-ink/65" key={label}>
          {label}：{value}
        </span>
      ))}
    </div>
  );
}

function CopyButton({ copied, label, onCopy }: { copied: boolean; label: string; onCopy: () => void }) {
  return (
    <button
      className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md border border-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-moss/40"
      onClick={onCopy}
      type="button"
    >
      {copied ? <Check className="h-4 w-4 text-moss" /> : <Copy className="h-4 w-4 text-ink/65" />}
      {copied ? "已复制" : label}
    </button>
  );
}

function copyGroupLabel(sectionKey: string, name: string): string {
  if (sectionKey === "posterCopySets") {
    return "复制整套海报文案";
  }
  if (name.startsWith("朋友圈")) {
    return `复制${name.replace(/^朋友圈/, "")}`;
  }
  return "复制本组";
}

function renderValue(value: StructuredValue): string {
  if (value === null) {
    return "";
  }
  if (typeof value !== "object") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(renderValue).join("\n");
  }
  return Object.entries(value)
    .map(([key, item]) => renderFieldLine(key, item))
    .join("\n");
}

function labelFor(key: string): string {
  return labels[key] ?? key;
}

function fieldTitle(value: Record<string, StructuredValue>): string {
  if (typeof value.name === "string") {
    return value.name;
  }
  if (typeof value.shot === "string") {
    return value.shot;
  }
  if (typeof value.mainTitle === "string") {
    return value.mainTitle.replace(/^大标题：/, "");
  }
  return "内容";
}

function renderFieldLine(key: string, value: StructuredValue): string {
  const label = labelFor(key);
  const rendered = renderValue(value);
  return rendered.startsWith(`${label}：`) ? rendered : `${label}：${rendered}`;
}

function formatStructuredContent(content: Record<string, StructuredValue>): string {
  return Object.entries(content)
    .map(([key, value]) => `${labelFor(key)}\n${renderValue(value)}`)
    .join("\n\n");
}

function parseStructuredContent(content: string): Record<string, StructuredValue> | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return null;
    }
    return parsed as Record<string, StructuredValue>;
  } catch {
    return null;
  }
}
