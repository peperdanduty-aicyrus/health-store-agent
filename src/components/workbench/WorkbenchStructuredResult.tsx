"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { markWorkbenchCopied } from "@/app/lvminglei/actions";

type StructuredValue = string | number | boolean | null | StructuredValue[] | { [key: string]: StructuredValue };

const labels: Record<string, string> = {
  answer: "回复",
  bottomGuides: "底部引导语",
  closingScripts: "引导成交话术",
  commentReplies: "评论/私聊回复",
  coverTitles: "封面标题",
  dmGuides: "私信引导话术",
  douyinLayout: "抖音/视频号排版建议",
  douyinTitles: "抖音/视频号标题",
  hooks: "开头 3 秒钩子",
  imagePrompts: "AI 作图提示词",
  imageTextIdeas: "朋友圈配图短句",
  mainTitles: "主标题",
  momentsLayout: "朋友圈海报排版建议",
  momentsPost: "朋友圈同步文案",
  momentsPosts: "朋友圈文案",
  objectionReplies: "客户异议回复",
  pinnedComments: "评论区置顶话术",
  privateInviteScripts: "微信私聊邀约话术",
  question: "问题",
  sellingPoints: "海报三条卖点",
  sevenDayPosts: "适合连续 7 天发的朋友圈",
  subtitles: "副标题",
  todayReadyPosts: "适合今天直接发的朋友圈",
  videoScript: "短视频口播稿",
  xianyuDetail: "闲鱼详情文案",
  xianyuLayout: "闲鱼主图排版建议",
  xianyuTitles: "闲鱼标题",
  xiaohongshuLayout: "小红书封面排版建议",
  xiaohongshuPost: "小红书文案",
};

export function WorkbenchStructuredResult({ content, generationId }: { content: string; generationId?: string }) {
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
          <CopyButton copied={copiedKey === sectionKey} label="复制本组" onCopy={() => onCopy(renderValue(value), sectionKey)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((item, index) => (
            <div className="flex min-h-12 items-start justify-between gap-3 rounded-md bg-white p-3 text-sm leading-6 text-ink/75" key={`${sectionKey}-${index}`}>
              <span className="select-text">{renderValue(item)}</span>
              <CopyButton copied={copiedKey === `${sectionKey}-${index}`} label="复制" onCopy={() => onCopy(renderValue(item), `${sectionKey}-${index}`)} />
            </div>
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
    .map(([key, item]) => `${labelFor(key)}：${renderValue(item)}`)
    .join("\n");
}

function labelFor(key: string): string {
  return labels[key] ?? key;
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
