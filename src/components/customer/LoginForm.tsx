"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginWithPassword, type LoginFormState } from "@/app/actions";

const initialState: LoginFormState = {
  message: "",
};

export function LoginForm({ audience = "operator" }: { audience?: "operator" | "admin" }) {
  const [state, action, pending] = useActionState(loginWithPassword, initialState);
  const isAdmin = audience === "admin";

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{isAdmin ? "系统管理员登录" : "运营人员登录"}</h1>
      <p className="mt-2 text-sm leading-6 text-ink/62">
        {isAdmin ? "请使用系统管理员账号登录 Agent 管理后台。" : "请使用管理员发放的运营账号和密码登录。系统不开放自由注册。"}
      </p>
      <label className="mt-5 block text-sm font-medium text-ink/75">
        {isAdmin ? "管理员账号" : "运营账号"}
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
      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-ink/15 bg-paper px-4 py-2 text-sm font-medium text-ink"
        href="/"
      >
        返回服务首页
      </Link>
    </form>
  );
}
