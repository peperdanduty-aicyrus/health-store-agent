import Link from "next/link";
import type { OpeningApplication } from "@/lib/data/types";

export function ApplicationManagement({ applications }: { applications: OpeningApplication[] }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">开通申请</h2>
      <div className="mt-5 grid gap-4">
        {applications.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-white p-5 text-sm text-ink/62">暂无开通申请。</p>
        ) : (
          applications.map((application) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={application.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{application.storeName}</p>
                <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink/60">{application.status}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {application.storeType} / {application.cityArea} / {application.contactName} / {application.phone}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/62">{application.interestedFeatures || "未填写关注功能"}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">{application.note || "未填写备注"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {application.status === "opened" ? (
                  <span className="inline-flex min-h-10 items-center rounded-md bg-moss/10 px-4 text-sm font-medium text-moss">
                    已开通账号
                  </span>
                ) : (
                  <Link
                    className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-white"
                    href={`/cyrus/users/new?applicationId=${application.id}`}
                  >
                    开通为客户账号
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
