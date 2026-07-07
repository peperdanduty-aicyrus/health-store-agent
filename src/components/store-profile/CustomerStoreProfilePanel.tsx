"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteCustomerStoreProfile,
  saveCustomerStoreProfileText,
  summarizeCustomerStoreProfileText,
  type StoreProfileActionState,
} from "@/app/actions";
import type { StoreProfileRecord } from "@/lib/data/types";
import { formatChinaDateTime } from "@/lib/date-format";
import { getVisibleActionStates } from "./textProfileState";

const initialState: StoreProfileActionState = {
  message: "",
  success: false,
};

export function CustomerStoreProfilePanel({ record }: { record: StoreProfileRecord | null }) {
  const [rawText, setRawText] = useState(record?.extractedText || "");
  const [profileSummary, setProfileSummary] = useState(record?.profileSummary || "");
  const [summarizeState, summarizeAction, summarizePending] = useActionState(summarizeCustomerStoreProfileText, initialState);
  const [saveState, saveAction, savePending] = useActionState(saveCustomerStoreProfileText, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCustomerStoreProfile, initialState);
  const states = getVisibleActionStates([summarizeState, saveState, deleteState]);

  useEffect(() => {
    setRawText(record?.extractedText || "");
    setProfileSummary(record?.profileSummary || "");
  }, [record?.id, record?.updatedAt, record?.extractedText, record?.profileSummary]);

  useEffect(() => {
    const latest = [summarizeState, saveState].find((state) => state.success && (state.rawText || state.profileSummary));
    if (latest?.rawText !== undefined) {
      setRawText(latest.rawText);
    }
    if (latest?.profileSummary !== undefined) {
      setProfileSummary(latest.profileSummary);
    }
  }, [summarizeState, saveState]);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">店铺资料库</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">我的店铺资料</h2>
        <p className="mt-3 text-sm leading-6 text-ink/62">
          粘贴本店介绍、项目价目表、服务流程等资料后，系统会自动整理成店铺资料摘要。后续生成小红书、朋友圈、美团、抖音/快手文案时，会优先结合本店真实资料，让内容更贴近门店。
        </p>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          为控制生成成本，生成文案时只会引用保存后的店铺资料摘要，不会反复读取整段原始资料。
        </p>
        {states.map((state) => (
          <p
            className={`mt-4 rounded-md p-3 text-sm ${state.success ? "bg-moss/10 text-moss" : "bg-coral/10 text-coral"}`}
            key={state.message}
          >
            {state.message}
          </p>
        ))}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Info label="当前状态" value={record ? "已填写" : "未填写"} />
          <Info label="原始资料" value={record?.extractedText ? "已填写" : "未填写"} />
          <Info label="更新时间" value={record ? formatChinaDateTime(record.updatedAt) : "暂无"} />
        </div>

        {!record ? <p className="mt-5 rounded-md bg-paper p-3 text-sm text-ink/62">当前还没有填写店铺资料。</p> : null}

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-medium text-ink/75">
            店铺原始资料
            <textarea
              className="mt-2 min-h-[220px] w-full rounded-md border border-ink/12 bg-paper p-4 text-sm leading-7 text-ink outline-none focus:border-moss"
              onChange={(event) => setRawText(event.target.value)}
              placeholder="粘贴门店简介、项目、价格、服务流程、门店优势、注意事项等。"
              value={rawText}
            />
          </label>
          <label className="text-sm font-medium text-ink/75">
            店铺资料摘要
            <textarea
              className="mt-2 min-h-[360px] w-full rounded-md border border-ink/12 bg-paper p-4 text-sm leading-7 text-ink outline-none focus:border-moss"
              onChange={(event) => setProfileSummary(event.target.value)}
              placeholder="点击 AI整理资料摘要 后会自动生成，也可以手动填写。"
              value={profileSummary}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={summarizeAction}>
            <input name="rawText" type="hidden" value={rawText} />
            <button
              className="min-h-10 rounded-md border border-ink/10 bg-paper px-3 text-sm font-medium text-ink disabled:opacity-60"
              disabled={summarizePending}
              type="submit"
            >
              {summarizePending ? "整理中" : "AI整理资料摘要"}
            </button>
          </form>
          <form action={saveAction}>
            <input name="rawText" type="hidden" value={rawText} />
            <input name="profileSummary" type="hidden" value={profileSummary} />
            <button
              className="min-h-10 rounded-md bg-moss px-4 text-sm font-medium text-white disabled:opacity-60"
              disabled={savePending}
              type="submit"
            >
              保存资料
            </button>
          </form>
          {record ? (
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm("确定要删除当前店铺资料吗？删除后，后续生成内容将不再自动引用本店资料。")) {
                  event.preventDefault();
                }
              }}
            >
              <button
                className="min-h-10 rounded-md border border-coral/30 bg-white px-3 text-sm font-medium text-coral disabled:opacity-60"
                disabled={deletePending}
                type="submit"
              >
                删除资料
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-ink">{value}</p>
    </div>
  );
}
