"use client";

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
  sensitiveCheck: "敏感词检查",
  shortPosts: "短朋友圈",
  subtitles: "副标题",
  tags: "标签",
  targetUsers: "适合人群",
  titles: "标题",
};

export function StructuredGenerationResult({ content, sensitiveCheck }: { content: string; sensitiveCheck?: string }) {
  const parsed = parseStructuredContent(content);

  if (!parsed) {
    return (
      <section className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
        <p className="text-sm font-semibold text-ink">生成结果</p>
        <pre className="mt-3 select-text whitespace-pre-wrap text-sm leading-7 text-ink/75">{content}</pre>
        {sensitiveCheck ? <p className="mt-4 rounded-md bg-white p-3 text-sm leading-6 text-ink/70">{sensitiveCheck}</p> : null}
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
      <p className="text-sm font-semibold text-ink">生成结果</p>
      <div className="mt-4 grid gap-4">
        {Object.entries(parsed).map(([key, value]) => (
          <ResultSection key={key} name={labelFor(key)} value={value} />
        ))}
      </div>
      {sensitiveCheck ? <p className="mt-4 rounded-md bg-white p-3 text-sm leading-6 text-ink/70">{sensitiveCheck}</p> : null}
    </section>
  );
}

function ResultSection({ name, value }: { name: string; value: StructuredValue }) {
  if (Array.isArray(value)) {
    return (
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">{name}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((item, index) => (
            <div className="rounded-md bg-white p-3 text-sm leading-6 text-ink/75" key={`${name}-${index}`}>
              {renderValue(item)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{name}</p>
      <div className="select-text whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-7 text-ink/75">{renderValue(value)}</div>
    </div>
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
