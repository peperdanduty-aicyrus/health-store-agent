"use client";

import { useActionState } from "react";
import {
  deleteCustomerStoreProfile,
  regenerateCustomerStoreProfileSummary,
  saveCustomerStoreProfileSummary,
  uploadCustomerStoreProfile,
  type StoreProfileActionState,
} from "@/app/actions";
import type { StoreProfileRecord } from "@/lib/data/types";
import { getVisibleActionStates, validatePdfBeforeSubmit } from "./uploadClientGuards";

const initialState: StoreProfileActionState = {
  message: "",
  success: false,
};

export function CustomerStoreProfilePanel({ record }: { record: StoreProfileRecord | null }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadCustomerStoreProfile, initialState);
  const [saveState, saveAction, savePending] = useActionState(saveCustomerStoreProfileSummary, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCustomerStoreProfile, initialState);
  const [regenerateState, regenerateAction, regeneratePending] = useActionState(
    regenerateCustomerStoreProfileSummary,
    initialState,
  );
  const states = getVisibleActionStates([uploadState, saveState, deleteState, regenerateState]);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">店铺资料库</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">我的店铺资料</h2>
        <p className="mt-3 text-sm leading-6 text-ink/62">
          上传本店介绍、项目价目表、服务流程等 PDF 资料后，系统会自动生成店铺资料摘要。后续生成小红书、朋友圈、美团、抖音/快手文案时，会优先结合本店真实资料，让内容更贴近门店。
        </p>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          为控制生成成本和保证识别效果，目前仅支持 2MB 以内的文字版 PDF，暂不支持扫描件或图片版 PDF。
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
          <Info label="当前状态" value={record ? "已上传" : "未上传"} />
          <Info label="PDF 文件" value={record?.pdfFileName || "暂无"} />
          <Info label="上传时间" value={record ? new Date(record.updatedAt).toLocaleString("zh-CN") : "暂无"} />
        </div>

        {!record ? <p className="mt-5 rounded-md bg-paper p-3 text-sm text-ink/62">当前还没有上传店铺资料。</p> : null}

        <form action={uploadAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={validatePdfBeforeSubmit}>
          <label className="text-sm font-medium text-ink/75 sm:flex-1">
            上传 / 重新上传 PDF
            <input
              accept="application/pdf,.pdf"
              className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 py-2 text-sm outline-none focus:border-moss"
              name="pdf"
              required
              type="file"
            />
          </label>
          <button className="min-h-11 rounded-md bg-ink px-5 text-sm font-medium text-white disabled:opacity-60" disabled={uploadPending} type="submit">
            {uploadPending ? "上传中" : record ? "重新上传 PDF" : "上传 PDF"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-coral">资料摘要</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">后续生成会优先参考这份资料</h3>
          </div>
          {record ? (
            <div className="flex flex-wrap gap-2">
              <form
                action={regenerateAction}
                onSubmit={(event) => {
                  if (!window.confirm("重新生成会覆盖当前资料摘要，确定继续吗？")) {
                    event.preventDefault();
                  }
                }}
              >
                <button
                  className="min-h-10 rounded-md border border-ink/10 bg-paper px-3 text-sm font-medium text-ink disabled:opacity-60"
                  disabled={regeneratePending}
                  type="submit"
                >
                  重新生成资料摘要
                </button>
              </form>
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
            </div>
          ) : null}
        </div>

        <form action={saveAction} className="mt-4">
          <textarea
            className="min-h-[420px] w-full rounded-md border border-ink/12 bg-paper p-4 text-sm leading-7 text-ink outline-none focus:border-moss"
            defaultValue={record?.profileSummary || ""}
            name="profileSummary"
            placeholder="上传 PDF 后这里会自动生成摘要，也可以手动填写店铺基础信息、核心项目、项目卖点、服务流程和注意事项。"
          />
          <button className="mt-4 min-h-11 rounded-md bg-moss px-5 text-sm font-medium text-white disabled:opacity-60" disabled={savePending} type="submit">
            保存摘要
          </button>
        </form>
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
