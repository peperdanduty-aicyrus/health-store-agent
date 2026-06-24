"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { type SurveyFieldDefinition } from "@/lib/survey/merchant-form";

export function MerchantSurveyForm({
  defaultFieldValues,
  errorMessage,
  fields,
  periodLabel,
  storeId,
}: {
  defaultFieldValues: Record<string, unknown>;
  errorMessage?: string;
  fields: SurveyFieldDefinition[];
  periodLabel: string;
  storeId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string | string[]>>({});
  const [peerRows, setPeerRows] = useState([{ id: "1", mallName: "", salesWan: "" }]);
  const [noLocalPeerStores, setNoLocalPeerStores] = useState(false);
  const draftKey = `survey-draft-${storeId}-${periodLabel}`;

  useEffect(() => {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) {
      setDraftLoaded(true);
      return;
    }
    try {
      const draft = JSON.parse(raw) as { noLocalPeerStores?: boolean; peerRows?: typeof peerRows; values?: Record<string, string | string[]> };
      setDraftValues(draft.values ?? {});
      if (draft.peerRows?.length) {
        setPeerRows(draft.peerRows);
      }
      setNoLocalPeerStores(Boolean(draft.noLocalPeerStores));
    } catch {
      window.localStorage.removeItem(draftKey);
    } finally {
      setDraftLoaded(true);
    }
  }, [draftKey]);

  useEffect(() => {
    window.localStorage.setItem(draftKey, JSON.stringify({ noLocalPeerStores, peerRows, values: draftValues }));
  }, [draftKey, draftValues, noLocalPeerStores, peerRows]);

  const commonFields = useMemo(() => fields.filter((field) => field.categoryCode === "COMMON"), [fields]);
  const categoryFields = useMemo(() => fields.filter((field) => !commonFields.includes(field)), [commonFields, fields]);
  const renderedCommonFields = commonFields.filter((field) => !isStructuredPeerField(field) && isVisibleField(field));
  const renderedCategoryFields = categoryFields.filter((field) => isVisibleField(field));

  return (
    <form action="/survey/submit" className="space-y-5" key={draftLoaded ? "draft-loaded" : "draft-loading"} method="post" onInput={saveDraftFromForm} onChange={saveDraftFromForm} ref={formRef}>
      <input name="storeId" type="hidden" value={storeId} />
      <input name="periodMonth" type="hidden" value={periodLabel} />
      <Section title="一、经营基础数据">
        <div className="grid gap-4">
          {renderedCommonFields.map((field) => (
            <FieldControl defaultValue={draftValueFor(field) ?? defaultFieldValues[field.key]} field={field} key={field.key} />
          ))}
        </div>
      </Section>

      <Section title="二、业态专项数据">
        <div className="grid gap-4">
          {renderedCategoryFields.map((field) => (
            <FieldControl defaultValue={draftValueFor(field) ?? defaultFieldValues[field.key]} field={field} key={field.key} />
          ))}
        </div>
      </Section>

      <Section title="三、同城同质门店对应月销售情况">
        <p className="text-sm leading-6 text-ink/62">请填写您了解的同城同质店铺所在商场及对应月销售额。</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/75">
          <input
            checked={noLocalPeerStores}
            name="noLocalPeerStores"
            onChange={(event) => setNoLocalPeerStores(event.target.checked)}
            type="checkbox"
            value="true"
          />
          本地暂无其他同质门店
        </label>
        {!noLocalPeerStores ? (
          <div className="mt-3 space-y-3">
            {peerRows.map((row, index) => (
              <div className="grid gap-2 rounded-md border border-ink/10 bg-paper p-3 sm:grid-cols-[1fr_160px_80px]" key={row.id}>
                <input
                  className="min-h-11 rounded-md border border-ink/12 bg-white px-3"
                  name="peerMallName"
                  onChange={(event) => updatePeerRow(row.id, { mallName: event.target.value })}
                  placeholder="商场名称"
                  value={row.mallName}
                />
                <input
                  className="min-h-11 rounded-md border border-ink/12 bg-white px-3"
                  inputMode="decimal"
                  name="peerSalesWan"
                  onChange={(event) => updatePeerRow(row.id, { salesWan: event.target.value })}
                  placeholder="销售额（万元）"
                  type="number"
                  value={row.salesWan}
                />
                <button
                  className="min-h-11 rounded-md border border-ink/15 bg-white px-3 text-sm"
                  disabled={peerRows.length === 1}
                  onClick={() => setPeerRows((rows) => rows.filter((item) => item.id !== row.id))}
                  type="button"
                >
                  删除
                </button>
                <span className="sr-only">第 {index + 1} 行</span>
              </div>
            ))}
            <button
              className="min-h-11 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-medium"
              onClick={() => setPeerRows((rows) => [...rows, { id: String(Date.now()), mallName: "", salesWan: "" }])}
              type="button"
            >
              新增一行
            </button>
          </div>
        ) : null}
      </Section>

      <div className="sticky bottom-0 z-10 border-t border-ink/10 bg-paper py-4">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60"
          type="submit"
        >
          提交经营数据
        </button>
        {errorMessage ? <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm text-coral">{errorMessage}</p> : null}
      </div>
    </form>
  );

  function updatePeerRow(id: string, patch: Partial<{ mallName: string; salesWan: string }>) {
    setPeerRows((rows) => rows.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function saveDraftFromForm(_event: FormEvent<HTMLFormElement>) {
    if (!formRef.current) {
      return;
    }
    setDraftValues(readDraftValues(formRef.current));
  }

  function draftValueFor(field: SurveyFieldDefinition) {
    return draftValues[`field_${field.key}`];
  }

  function isVisibleField(field: SurveyFieldDefinition) {
    const rating = String(draftValues.field_business_self_rating ?? defaultFieldValues.business_self_rating ?? "");
    if (field.key === "improvement_reason_codes") {
      return ["明显提升", "小幅提升"].includes(rating);
    }
    if (field.key === "decline_reason_codes") {
      return ["小幅下降", "明显下降"].includes(rating);
    }
    if (field.key === "stable_reason_text") {
      return rating === "基本持平";
    }
    if (field.key === "other_reason_text") {
      const selected = [
        ...toStringArray(draftValues.field_improvement_reason_codes ?? defaultFieldValues.improvement_reason_codes),
        ...toStringArray(draftValues.field_decline_reason_codes ?? defaultFieldValues.decline_reason_codes),
      ];
      return selected.some((value) => value.includes("其他"));
    }
    return true;
  }
}

function isStructuredPeerField(field: SurveyFieldDefinition) {
  return field.key === "city_peer_store_sales" || field.key === "no_local_peer_stores";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return value ? [String(value)] : [];
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldControl({ defaultValue, field }: { defaultValue: unknown; field: SurveyFieldDefinition }) {
  const name = `field_${field.key}`;
  const value = typeof defaultValue === "string" || typeof defaultValue === "number" ? String(defaultValue) : "";

  if (field.type === "radio") {
    return (
      <fieldset>
        <legend className="text-sm font-medium text-ink/75">{field.label}</legend>
        <div className="mt-2 grid gap-2">
          {field.options?.map((option) => (
            <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" key={option}>
              <input defaultChecked={value === option} name={name} required={field.required} type="radio" value={option} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "multiselect") {
    const selectedValues = Array.isArray(defaultValue) ? defaultValue.map(String) : value ? [value] : [];
    return (
      <fieldset>
        <legend className="text-sm font-medium text-ink/75">{field.label}</legend>
        <p className="mt-1 text-xs text-ink/55">
          {field.minSelections ? `至少选择${field.minSelections}项` : "可多选"}
          {field.maxSelections ? `，最多选择${field.maxSelections}项。` : "。"}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {field.options?.map((option) => (
            <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" key={option}>
              <input defaultChecked={selectedValues.includes(option)} name={name} type="checkbox" value={option} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block text-sm font-medium text-ink/75">
        {field.label}
        {field.unit ? <span className="ml-2 text-xs text-ink/50">{field.unit}</span> : null}
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-ink/12 bg-paper p-3 outline-none focus:border-moss"
          defaultValue={value}
          name={name}
          required={field.required}
        />
        <HelpText field={field} />
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium text-ink/75">
        <input defaultChecked={value === "true" || value === "是"} name={name} type="checkbox" value="true" />
        {field.label}
        <HelpText field={field} />
      </label>
    );
  }

  return (
    <label className="block text-sm font-medium text-ink/75">
      {field.label}
      <span className="ml-2 text-xs text-ink/50">{field.unit}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        defaultValue={value}
        inputMode={field.type === "number" ? "decimal" : undefined}
        max={field.maxValue}
        min={field.minValue}
        name={name}
        required={field.required}
        step={field.type === "number" ? field.precision === 0 ? "1" : "0.1" : undefined}
        type={field.type === "number" ? "number" : "text"}
      />
      {field.key === "self_reported_sales_wan" ? (
        <span className="mt-1 block text-xs leading-5 text-ink/55">
          单位万元，精确到0.1；按商场POS收银系统口径，含税，不扣除扣点、租金、活动承担费用，不包含线上渠道销售。
        </span>
      ) : <HelpText field={field} />}
    </label>
  );
}

function HelpText({ field }: { field: SurveyFieldDefinition }) {
  const text = field.helpText || field.validationText;
  return text ? <span className="mt-1 block text-xs leading-5 text-ink/55">{text}</span> : null;
}

function readDraftValues(form: HTMLFormElement): Record<string, string | string[]> {
  const formData = new FormData(form);
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "storeId" || key === "peerMallName" || key === "peerSalesWan" || key === "noLocalPeerStores") {
      continue;
    }
    const text = String(value);
    const existing = values[key];
    if (existing) {
      values[key] = Array.isArray(existing) ? [...existing, text] : [existing, text];
    } else {
      values[key] = text;
    }
  }
  return values;
}
