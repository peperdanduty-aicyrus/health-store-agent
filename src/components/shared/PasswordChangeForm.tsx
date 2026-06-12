"use client";

import { useActionState } from "react";
import { changeOwnPassword, type PasswordFormState } from "@/app/actions";

const initialState: PasswordFormState = {
  message: "",
  success: false,
};

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, initialState);

  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-coral">修改密码</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PasswordField label="原密码" name="currentPassword" />
        <PasswordField label="新密码" name="newPassword" />
        <PasswordField label="确认新密码" name="confirmPassword" />
      </div>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "提交中" : "修改密码"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
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
