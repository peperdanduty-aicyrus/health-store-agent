"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { markGeneratedContentCopied } from "@/app/actions";

type StructuredValue = string | number | boolean | null | StructuredValue[] | { [key: string]: StructuredValue };

const labels: Record<string, string> = {
  answer: "回复",
  body: "正文",
  closingGuide: "结尾引导",
  commentGuide: "评论区引导",
  conversionScript: "到店转化话术",
  coverTexts: "封面文字",
  followUp: "跟进话术",
  heading: "小标题",
  highlights: "项目亮点",
  imageIdeas: "配图建议",
  intro: "文章开头",
  longPosts: "长朋友圈",
  purchaseNotes: "购买须知",
  question: "问题",
  replies: "回复话术",
  reviews: "好评话术",
  sections: "正文段落",
  shortPosts: "短朋友圈",
  subtitles: "副标题",
  tags: "标签",
  targetUsers: "适合人群",
  titles: "标题",
};

export function StructuredGenerationResult({ content, generationId }: { content: string; generationId?: string }) {
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
        void markGeneratedContentCopied(generationId);
      });
    }
  }

  if (!parsed) {
    return (
      <section className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
        <ResultHeader copied={copiedKey === "full"} onCopy={() => copyText(fullText, "full")} />
        <pre className="mt-3 select-text whitespace-pre-wrap text-sm leading-7 text-ink/75">{content}</pre>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
      <ResultHeader copied={copiedKey === "full"} onCopy={() => copyText(fullText, "full")} />
      <div className="mt-4 grid gap-4">
        {Object.entries(parsed).map(([key, value]) => (
          <ResultSection
            copiedKey={copiedKey}
            key={key}
            name={labelFor(key)}
            onCopy={(text, copyKey) => copyText(text, copyKey)}
            sectionKey={key}
            value={value}
          />
        ))}
      </div>
    </section>
  );
}

function ResultHeader({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-ink">生成结果</p>
      <CopyButton copied={copied} label="复制全文" onCopy={onCopy} />
    </div>
  );
}

function ResultSection({
  copiedKey,
  name,
  onCopy,
  sectionKey,
  value,
}: {
  copiedKey: string;
  name: string;
  onCopy: (text: string, key: string) => void;
  sectionKey: string;
  value: StructuredValue;
}) {
  if (Array.isArray(value)) {
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{name}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((item, index) => (
            <div
              className="flex min-h-12 items-start justify-between gap-3 rounded-md bg-white p-3 text-sm leading-6 text-ink/75"
              key={`${sectionKey}-${index}`}
            >
              <span className="select-text">{renderValue(item)}</span>
              <CopyButton
                copied={copiedKey === `${sectionKey}-${index}`}
                label="复制"
                onCopy={() => onCopy(renderValue(item), `${sectionKey}-${index}`)}
              />
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
        <CopyButton copied={copiedKey === sectionKey} label="复制" onCopy={() => onCopy(`${name}\n${renderValue(value)}`, sectionKey)} />
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
    const { sensitiveCheck: _sensitiveCheck, ...publishableContent } = parsed as Record<string, StructuredValue>;
    return publishableContent;
  } catch {
    return null;
  }
}
