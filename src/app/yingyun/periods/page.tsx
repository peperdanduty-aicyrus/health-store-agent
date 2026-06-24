import { SurveyShell } from "@/components/survey/SurveyShell";
import { getCurrentSurveyPeriod } from "@/lib/survey/merchant-form";
import { getOperatorContext } from "../operator-context";

export default async function PeriodsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const period = getCurrentSurveyPeriod(new Date("2026-06-23T00:00:00.000Z"));
  const periods = await context.store.listSurveyPeriods(context.staff.mallId);
  return (
    <SurveyShell staff={context.staff} title="填报月份管理">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">当前自动填报月份</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <Info label="月份" value={period.periodMonth} />
          <Info label="正常截止" value={period.normalFillEndsAt} />
          <Info label="当前状态" value={period.isLate ? "逾期补填" : "正常填报"} />
        </dl>
        <div className="mt-5 rounded-md border border-moss/20 bg-moss/10 p-4 text-sm leading-6 text-moss">
          营运可重新开放更早月份、设置截止时间或提前关闭；操作会写入操作日志。商户默认不能自行选择更早月份。
        </div>
        <form action="/yingyun/periods/submit" className="mt-4 grid gap-3 rounded-md border border-ink/10 bg-paper p-4 md:grid-cols-5" method="post">
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={period.periodMonth} name="periodMonth" type="month" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={`${period.periodMonth}-01`} name="normalFillStartsAt" type="date" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={period.normalFillEndsAt} name="normalFillEndsAt" type="date" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="reopenedUntil" type="date" />
          <select className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="periodAction">
            <option value="open">开启</option>
            <option value="reopen">重新开放</option>
            <option value="close">关闭</option>
          </select>
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white md:col-span-5" type="submit">保存月份状态</button>
        </form>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-paper text-ink/58">
              <tr>{["月份", "状态", "正常截止", "重新开放至", "开启人", "关闭人"].map((item) => <th className="px-3 py-2" key={item}>{item}</th>)}</tr>
            </thead>
            <tbody>
              {periods.map((item) => (
                <tr className="border-t border-ink/8" key={item.id}>
                  <td className="px-3 py-2">{item.periodMonth}</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2">{item.normalFillEndsAt || "-"}</td>
                  <td className="px-3 py-2">{item.reopenedUntil || "-"}</td>
                  <td className="px-3 py-2">{item.openedBy || "-"}</td>
                  <td className="px-3 py-2">{item.closedBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SurveyShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-3">
      <dt className="text-ink/55">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
