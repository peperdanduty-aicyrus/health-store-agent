"use client";

import { useActionState } from "react";
import { loginWithPassword, type LoginFormState } from "@/app/actions";

const initialState: LoginFormState = {
  message: "",
};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithPassword, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">登录账号</h1>
      <p className="mt-2 text-sm leading-6 text-ink/62">账号由管理员人工开通，不支持自助注册。</p>
      <label className="mt-5 block text-sm font-medium text-ink/75">
        手机号
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
          name="phone"
          placeholder="请输入手机号"
          required
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-ink/75">
        密码
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
          name="password"
          placeholder="请输入密码"
          required
          type="password"
        />
      </label>
      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "登录中" : "登录"}
      </button>
      {state.message ? <p className="mt-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{state.message}</p> : null}
    </form>
  );
}
