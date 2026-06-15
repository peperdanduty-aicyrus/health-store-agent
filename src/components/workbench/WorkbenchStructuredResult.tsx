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
  douyinLayout: "抖音/视频号排版建议",
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
  momentsConversionPosts: "朋友圈成交引导版",
  name: "名称",
  objectionReplies: "客户异议回复",
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
  videoTitles: "视频标题",
  visual: "画面",
  visualSubject: "画面主体",
  voiceover: "口播/字幕",
  voiceoverScript: "口播稿",
  xianyuDetail: "闲鱼详情文案",
  xianyuLayout: "闲鱼主图排版建议",
  xianyuTitles: "闲鱼标题",
  xiaohongshuLayout: "小红书封面排版建议",
  xiaohongshuPost: "小红书文案",
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
  const parsed = parseStructuredContent(content);
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
          <CopyButton copied={copiedKey === sectionKey} label={sectionKey === "posterCopySets" ? "复制整套海报文案" : "复制本组"} onCopy={() => onCopy(renderValue(value), sectionKey)} />
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
