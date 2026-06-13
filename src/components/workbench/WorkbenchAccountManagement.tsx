"use client";

import { useActionState } from "react";
import {
  createWorkbenchSubaccount,
  resetWorkbenchSubaccountPassword,
  toggleWorkbenchSubaccount,
  type WorkbenchActionState,
} from "@/app/lvminglei/actions";
import type { WorkbenchAccount } from "@/lib/data/types";

const initialState: WorkbenchActionState = {
  message: "",
  success: false,
};

export function WorkbenchAccountManagement({ accounts }: { accounts: WorkbenchAccount[] }) {
  const [createState, createAction, creating] = useActionState(createWorkbenchSubaccount, initialState);
  const [toggleState, toggleAction, toggling] = useActionState(toggleWorkbenchSubaccount, initialState);
  const [resetState, resetAction, resetting] = useActionState(resetWorkbenchSubaccountPassword, initialState);
  const subaccounts = accounts.filter((account) => account.role === "subaccount");

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <form action={createAction} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">新增子账号</h2>
        <Field label="账号" name="phone" placeholder="例如 13000000001" />
        <Field label="名称" name="displayName" placeholder="例如 剪辑助手" />
        <Field label="初始密码" name="password" placeholder="至少 6 位" type="password" />
        <label className="mt-4 block text-sm font-medium text-ink/75">
          备注
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-ink/12 bg-paper px-3 py-3 outline-none focus:border-moss"
            name="note"
            placeholder="例如负责短视频脚本"
          />
        </label>
        <button className="mt-5 min-h-11 w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60" disabled={creating} type="submit">
          {creating ? "创建中" : "创建子账号"}
        </button>
        <Message state={createState} />
      </form>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">子账号列表</h2>
        {subaccounts.length === 0 ? (
          <p className="mt-4 rounded-md bg-paper p-4 text-sm text-ink/62">还没有子账号。</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {subaccounts.map((account) => (
              <article className="rounded-md border border-ink/10 bg-paper p-4" key={account.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{account.displayName}</p>
                    <p className="mt-1 text-sm text-ink/62">{account.phone}</p>
                    {account.note ? <p className="mt-1 text-sm text-ink/55">{account.note}</p> : null}
                    <p className={`mt-2 text-xs font-medium ${account.disabled ? "text-coral" : "text-moss"}`}>
                      {account.disabled ? "已禁用" : "可登录"}
                    </p>
                  </div>
                  <form action={toggleAction}>
                    <input name="accountId" type="hidden" value={account.id} />
                    <input name="disabled" type="hidden" value={String(!account.disabled)} />
                    <button
                      className="inline-flex min-h-9 items-center rounded-md border border-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-60"
                      disabled={toggling}
                      type="submit"
                    >
                      {account.disabled ? "启用" : "禁用"}
                    </button>
                  </form>
                </div>
                <form action={resetAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input name="accountId" type="hidden" value={account.id} />
                  <input
                    className="min-h-10 flex-1 rounded-md border border-ink/12 bg-white px-3 outline-none focus:border-moss"
                    name="password"
                    placeholder="输入新密码"
                    required
                    type="password"
                  />
                  <button
                    className="min-h-10 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={resetting}
                    type="submit"
                  >
                    重置密码
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
        <Message state={toggleState} />
        <Message state={resetState} />
      </section>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder: string; type?: string }) {
  return (
    <label className="mt-4 block text-sm font-medium text-ink/75">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

function Message({ state }: { state: WorkbenchActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>{state.message}</p>;
}
