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
  "宠物医院",
  "其他本地健康门店",
];

export function OpeningApplicationForm() {
  const [state, action, pending] = useActionState(submitOpeningApplication, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-coral">免费试用</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">免费申请试用账号</h2>
      <p className="mt-2 text-sm leading-6 text-ink/62">只需留下 3 项信息，人工确认后发放免费试用账号，不自动扣费。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="门店名称" name="storeName" placeholder="例如：某某中医馆 / 某某口腔 / 某某推拿馆" required />
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
        <Field label="微信号 / 手机号" name="phone" placeholder="填写手机号或微信号，方便发放试用账号" required />
      </div>
      <label className="mt-3 block text-sm font-medium text-ink/75">
        备注需求
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-ink/12 bg-paper px-3 py-3 outline-none focus:border-moss"
          name="note"
          placeholder="例如：想生成小红书文案 / 朋友圈文案 / 美团团单 / 私域话术"
        />
      </label>
      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "提交中" : "提交免费试用申请"}
      </button>
      <p className="mt-3 text-xs leading-5 text-ink/58">提交后请添加微信，人工确认后发放免费试用账号，不自动扣费。</p>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
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
