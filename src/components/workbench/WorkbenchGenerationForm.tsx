"use client";

import { useActionState } from "react";
import { generateWorkbench, type WorkbenchGenerationState } from "@/app/lvminglei/actions";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import type { WorkbenchFieldDefinition } from "@/lib/domain/workbench";
import { WorkbenchStructuredResult } from "./WorkbenchStructuredResult";

const initialState: WorkbenchGenerationState = {
  message: "",
  success: false,
};

export function WorkbenchGenerationForm({
  fields,
  initialValues = {},
  type,
}: {
  fields: WorkbenchFieldDefinition[];
  initialValues?: Record<string, string>;
  type: WorkbenchGenerationType;
}) {
  const [state, action, pending] = useActionState(generateWorkbench, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <input name="type" type="hidden" value={type} />
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <Field defaultValue={initialValues[field.name] || ""} field={field} key={field.name} />
        ))}
      </div>
      <button className="mt-5 min-h-12 rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "生成中" : "生成内容"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>{state.message}</p>
      ) : null}
      {state.result ? <WorkbenchStructuredResult content={state.result} generationId={state.generationId} /> : null}
    </form>
  );
}

function Field({ defaultValue, field }: { defaultValue: string; field: WorkbenchFieldDefinition }) {
  const required = field.required !== false;
  const baseClass = "mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss";

  if (field.type === "textarea") {
    return (
      <label className="text-sm font-medium text-ink/75 sm:col-span-2">
        {field.label}
        <textarea
          className={`${baseClass} min-h-28 py-3`}
          defaultValue={defaultValue}
          name={field.name}
          placeholder={field.placeholder}
          required={required}
        />
      </label>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <label className="text-sm font-medium text-ink/75">
        {field.label}
        <select className={baseClass} defaultValue={defaultValue} name={field.name} required={required}>
          <option value="">请选择</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="text-sm font-medium text-ink/75">
      {field.label}
      <input className={baseClass} defaultValue={defaultValue} name={field.name} placeholder={field.placeholder} required={required} />
    </label>
  );
}
