import type { TrialApplication } from "@/lib/data/types";

export function ApplicationManagement({ applications }: { applications: TrialApplication[] }) {
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
            </article>
          ))
        )}
      </div>
    </section>
  );
}
