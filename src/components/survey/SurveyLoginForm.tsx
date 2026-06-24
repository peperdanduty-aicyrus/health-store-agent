"use client";

import { useActionState } from "react";
import { loginSurveyStaff, type SurveyActionState } from "@/app/survey-actions";

const initialState: SurveyActionState = {
  message: "",
  success: false,
};

export function SurveyLoginForm({ title }: { title: string }) {
  const [state, action, pending] = useActionState(loginSurveyStaff, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-ink/62">使用独立 survey 后台账号登录，不与旧系统账号混用。</p>
      <label className="mt-5 block text-sm font-medium text-ink/75">
        登录名
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
          name="loginName"
          placeholder="请输入登录名"
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
