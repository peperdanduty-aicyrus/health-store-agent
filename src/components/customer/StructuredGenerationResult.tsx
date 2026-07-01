"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { markGeneratedContentCopied } from "@/app/actions";
import type { SceneKey } from "@/lib/domain/scenes";
import {
  labelForGenerationKey,
  prepareGenerationPresentation,
  renderStructuredValue,
} from "@/lib/ai/generation-presentation";
import type { StructuredValue } from "@/lib/ai/scene-schemas";

export function StructuredGenerationResult({
  content,
  embedded = false,
  generationId,
  scene,
}: {
  content: string;
  embedded?: boolean;
  generationId?: string;
  scene: SceneKey;
}) {
  const presentation = prepareGenerationPresentation(scene, content);
  const [copiedKey, setCopiedKey] = useState("");
  const [, startTransition] = useTransition();

  async function copyText(text: string, key: string) {
    if (!text) {
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? "" : current)), 1600);
    if (generationId) {
      startTransition(() => {
        void markGeneratedContentCopied(generationId);
      });
    }
  }

  if (!presentation.displayable) {
    return (
      <section className={embedded ? "mt-4" : "mt-5 rounded-md border border-ink/10 bg-paper p-4"}>
        <p className="rounded-md bg-coral/10 p-3 text-sm text-coral">{presentation.message}</p>
      </section>
    );
  }

  return (
    <section className={embedded ? "mt-4" : "mt-5 rounded-md border border-ink/10 bg-paper p-4"}>
      <ResultHeader
        copied={copiedKey === "full"}
        onCopy={() => copyText(presentation.copyText, "full")}
      />
      <div className="mt-4 grid gap-4">
        {Object.entries(presentation.structuredContent).map(([key, value]) => (
          <ResultSection
            copiedKey={copiedKey}
            key={key}
            name={labelForGenerationKey(key)}
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
        <p className="mb-2 text-sm font-semibold text-ink">{name}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((item, index) => {
            const text = renderStructuredValue(item);
            return (
              <div
                className="flex min-h-12 items-start justify-between gap-3 rounded-md bg-white p-3 text-sm leading-6 text-ink/75"
                key={`${sectionKey}-${index}`}
              >
                <span className="select-text whitespace-pre-wrap">{text}</span>
                <CopyButton
                  copied={copiedKey === `${sectionKey}-${index}`}
                  label="复制"
                  onCopy={() => onCopy(text, `${sectionKey}-${index}`)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const text = renderStructuredValue(value);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <CopyButton copied={copiedKey === sectionKey} label="复制" onCopy={() => onCopy(`${name}\n${text}`, sectionKey)} />
      </div>
      <div className="select-text whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-7 text-ink/75">{text}</div>
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
