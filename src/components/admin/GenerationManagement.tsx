"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteAllGenerationRecords,
  deleteGenerationRecord,
  type DeleteActionState,
} from "@/app/actions";
import type { GenerationRecord } from "@/lib/data/types";
import { formatChinaDateTime } from "@/lib/date-format";
import { sceneDefinitions } from "@/lib/domain/scenes";
import { normalizeGenerationStatus } from "@/lib/ai/generation-record";

const initialState: DeleteActionState = {
  message: "",
  success: false,
};

export function GenerationManagement({ generations }: { generations: GenerationRecord[] }) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteGenerationRecord, initialState);
  const [deleteAllState, deleteAllAction, deleteAllPending] = useActionState(deleteAllGenerationRecords, initialState);
  const state = deleteState.message ? deleteState : deleteAllState;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-ink">生成记录</h2>
        <div className="flex flex-wrap items-center gap-3">
          {state.message ? (
            <p className={`rounded-md px-3 py-2 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}>
              {state.message}
            </p>
          ) : null}
          {generations.length > 0 ? (
            <form
              action={deleteAllAction}
              onSubmit={(event) => {
                if (!window.confirm("确定要删除全部生成记录吗？此操作不可恢复。")) {
                  event.preventDefault();
                }
              }}
            >
              <button
                className="min-h-10 rounded-md bg-coral px-4 text-sm font-medium text-white disabled:opacity-60"
                disabled={deleteAllPending}
                type="submit"
              >
                一键删除全部记录
              </button>
            </form>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {generations.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">暂无生成记录。</p>
        ) : (
          generations.map((record) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={record.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{record.storeName}</p>
                <p className="text-xs text-ink/50">{formatChinaDateTime(record.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {record.phone} / {sceneDefinitions[record.generationType].label} / {record.projectName} / 店铺资料：
                {record.usedStoreProfile ? "是" : "否"} / {record.modelProvider}:{record.modelName} / 状态：
                {statusLabel(normalizeGenerationStatus(record.status))}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm leading-6 text-ink/62">复制：{record.copied ? "是" : "否"}；备注：{record.userNote || "无"}</p>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium text-ink" href={`/agent-admin/generations/${record.id}`}>
                    查看详情
                  </Link>
                  <form
                    action={deleteAction}
                    onSubmit={(event) => {
                      if (!window.confirm("确定要删除这条生成记录吗？删除后不可恢复。")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input name="generationId" type="hidden" value={record.id} />
                    <button
                      className="min-h-10 rounded-md border border-coral/30 bg-white px-3 text-sm font-medium text-coral disabled:opacity-60"
                      disabled={deletePending}
                      type="submit"
                    >
                      删除
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function statusLabel(status: GenerationRecord["status"]): string {
  return status === "success" ? "成功" : status === "failed" ? "失败" : "旧记录";
}
