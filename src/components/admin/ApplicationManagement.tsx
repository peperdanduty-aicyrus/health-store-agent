"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteOpeningApplication, type DeleteActionState } from "@/app/actions";
import type { OpeningApplication } from "@/lib/data/types";
import { formatChinaDateTime } from "@/lib/date-format";

const initialState: DeleteActionState = {
  message: "",
  success: false,
};

export function ApplicationManagement({ applications }: { applications: OpeningApplication[] }) {
  const [state, action, pending] = useActionState(deleteOpeningApplication, initialState);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-ink">开通申请</h2>
        {state.message ? (
          <p className={`rounded-md px-3 py-2 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4">
        {applications.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">暂无开通申请。</p>
        ) : (
          applications.map((application) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={application.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{application.storeName}</p>
                <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink/60">{statusLabels[application.status]}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                门店类型：{application.storeType} / 联系方式：{application.phone}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/62">备注需求：{application.note || "未填写"}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">来源渠道：{application.sourceChannel}</p>
              <p className="mt-2 text-xs leading-6 text-ink/50">提交时间：{formatChinaDateTime(application.createdAt)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {application.status === "opened" ? (
                  <span className="inline-flex min-h-10 items-center rounded-md bg-moss/10 px-4 text-sm font-medium text-moss">
                    已开通账号
                  </span>
                ) : (
                  <Link
                    className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-white"
                    href={`/agent-admin/users/new?applicationId=${application.id}`}
                  >
                    开通7天体验账号
                  </Link>
                )}
                <form
                  action={action}
                  onSubmit={(event) => {
                    if (!window.confirm("确定要删除这条开通申请吗？删除后不可恢复。")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input name="applicationId" type="hidden" value={application.id} />
                  <button
                    className="inline-flex min-h-10 items-center rounded-md border border-coral/30 bg-white px-4 text-sm font-medium text-coral disabled:opacity-60"
                    disabled={pending}
                    type="submit"
                  >
                    删除
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

const statusLabels: Record<OpeningApplication["status"], string> = {
  new: "待处理",
  contacted: "已联系",
  opened: "已开通",
  ignored: "已忽略",
};
