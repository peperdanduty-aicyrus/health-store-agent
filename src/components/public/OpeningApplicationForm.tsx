"use client";

import { useActionState } from "react";
import { submitOpeningApplication, type OpeningApplicationFormState } from "@/app/actions";

const initialState: OpeningApplicationFormState = {
  message: "",
  success: false,
};

const storeTypes = [
  "中医馆 / 中医诊所",
  "推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆",
  "口腔门诊",
  "医院科室 / 综合门诊",
  "健康管理中心 / 体检中心",
];

export function OpeningApplicationForm() {
  const [state, action, pending] = useActionState(submitOpeningApplication, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-coral">开通咨询</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">提交门店信息后确认开通方案</h2>
      <p className="mt-2 text-sm leading-6 text-ink/62">只需留下 3 项信息，人工确认后再开通，不自动扣费。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="门店名称" name="storeName" required />
        <label className="text-sm font-medium text-ink/75">
          门店类型
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
            name="storeType"
            required
          >
            <option value="">请选择</option>
            {storeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <Field label="微信号 / 手机号" name="phone" required />
      </div>
      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "提交中" : "提交开通咨询"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        name={name}
        placeholder={label}
        required={required}
      />
    </label>
  );
}
