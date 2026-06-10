"use client";

import { useActionState } from "react";
import { createMerchantAccount, type CreateMerchantFormState } from "@/app/actions";

const initialState: CreateMerchantFormState = {
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
];

export function CreateMerchantForm() {
  const [state, action, pending] = useActionState(createMerchantAccount, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-coral">创建商家账号</p>
        <h2 className="text-xl font-semibold text-ink">主动开通客户登录权限</h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="手机号" name="phone" required />
        <Field label="初始密码" name="password" required />
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
        <Field label="城市 / 区域" name="cityArea" required />
        <label className="text-sm font-medium text-ink/75">
          套餐
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
            name="planName"
            required
          >
            <option value="basic_monthly">基础月卡</option>
            <option value="standard_monthly">标准月卡</option>
            <option value="internal_yearly">正式年卡</option>
            <option value="coaching">代运营陪跑</option>
          </select>
        </label>
        <Field defaultValue="30" label="每日次数" name="dailyLimit" required type="number" />
        <Field label="到期日期" name="expiresAt" required type="date" />
        <Field label="主营项目" name="mainProjects" />
        <Field label="门店优势" name="storeAdvantages" />
      </div>

      <button
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "创建中" : "创建账号"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  defaultValue,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        defaultValue={defaultValue}
        name={name}
        placeholder={label}
        required={required}
        type={type}
      />
    </label>
  );
}
