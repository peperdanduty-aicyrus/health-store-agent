"use client";

import { useActionState } from "react";
import { loginWorkbench, type WorkbenchLoginState } from "@/app/lvminglei/actions";

const initialState: WorkbenchLoginState = {
  message: "",
};

export function WorkbenchLoginForm() {
  const [state, action, pending] = useActionState(loginWorkbench, initialState);

  return (
    <form action={action} className="ops-login-card">
      <p className="ops-login-label">门店线上运营与 AI 搜索优化</p>
      <h1>运营总控台</h1>
      <p>内部系统，不开放注册。请使用超级管理员账号登录。</p>
      <label className="mt-5 block text-sm font-medium text-ink/75">
        账号
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
          name="phone"
          placeholder="请输入账号"
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
        className="ops-button ops-button-primary ops-login-submit"
        disabled={pending}
        type="submit"
      >
        {pending ? "登录中" : "登录运营总控台"}
      </button>
      {state.message ? <p className="mt-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{state.message}</p> : null}
    </form>
  );
}
