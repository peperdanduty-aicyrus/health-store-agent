"use client";

import { useActionState } from "react";
import {
  resetCustomerPassword,
  toggleCustomerDisabled,
  type CreateMerchantFormState,
  type PasswordFormState,
} from "@/app/actions";
import type { Profile } from "@/lib/data/types";

const toggleInitialState: CreateMerchantFormState = {
  message: "",
  success: false,
};

const passwordInitialState: PasswordFormState = {
  message: "",
  success: false,
};

export function CustomerAccountActions({ user }: { user: Profile }) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleCustomerDisabled, toggleInitialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(resetCustomerPassword, passwordInitialState);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={toggleAction} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <input name="userId" type="hidden" value={user.id} />
        <input name="disabled" type="hidden" value={user.disabled ? "false" : "true"} />
        <p className="text-sm font-semibold text-coral">账号状态</p>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          当前状态：{user.disabled ? "已禁用，客户不能登录和生成内容" : "已启用，客户可以正常使用"}
        </p>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2 font-medium text-white disabled:opacity-60"
          disabled={togglePending}
          type="submit"
        >
          {togglePending ? "提交中" : user.disabled ? "启用用户" : "禁用用户"}
        </button>
        {toggleState.message ? (
          <p className={`mt-4 rounded-md p-3 text-sm ${toggleState.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
            {toggleState.message}
          </p>
        ) : null}
      </form>

      <form action={passwordAction} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <input name="userId" type="hidden" value={user.id} />
        <p className="text-sm font-semibold text-coral">重置密码</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PasswordField label="新密码" name="newPassword" />
          <PasswordField label="确认新密码" name="confirmPassword" />
        </div>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2 font-medium text-white disabled:opacity-60"
          disabled={passwordPending}
          type="submit"
        >
          {passwordPending ? "提交中" : "重置密码"}
        </button>
        {passwordState.message ? (
          <p className={`mt-4 rounded-md p-3 text-sm ${passwordState.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
            {passwordState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <label className="text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        name={name}
        required
        type="password"
      />
    </label>
  );
}
