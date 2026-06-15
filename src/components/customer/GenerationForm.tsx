"use client";

import { useActionState } from "react";
import { generateForScene, type GenerationFormState } from "@/app/actions";
import { StructuredGenerationResult } from "./StructuredGenerationResult";

const initialState: GenerationFormState = {
  message: "",
  success: false,
};

const purposes = [
  "引流到店",
  "提高咨询",
  "推广团购",
  "提升信任",
  "激活老客户",
  "活动转化",
  "科普种草",
  "预约到店",
  "好评引导",
  "私域成交",
];

export function GenerationForm({ scene }: { scene: string }) {
  const [state, action, pending] = useActionState(generateForScene, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <input name="scene" type="hidden" value={scene} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="项目名称" name="projectName" placeholder="例如小儿推拿、肩颈调理、洁牙、艾灸" />
        <Field label="目标客户" name="targetCustomer" placeholder="例如宝妈、上班族、中老年人、附近居民" />
        <label className="text-sm font-medium text-ink/75">
          宣传目的
          <select className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss" name="purpose" required>
            <option value="">请选择</option>
            {purposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </label>
        <Field label="补充信息" name="extraInfo" placeholder="例如价格、活动、门店优势、注意事项" required={false} />
      </div>
      <button className="mt-5 min-h-12 rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "生成中" : "生成内容"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>{state.message}</p>
      ) : null}
      {state.result ? <StructuredGenerationResult content={state.result} generationId={state.generationId} /> : null}
    </form>
  );
}

function Field({ label, name, placeholder, required = true }: { label: string; name: string; placeholder: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
