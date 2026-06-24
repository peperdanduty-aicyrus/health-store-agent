import { SurveyLoginForm } from "@/components/survey/SurveyLoginForm";
import { buildOperatorDataset } from "@/lib/survey/operator-data";
import { getSurveyStore } from "@/lib/survey/repository";
import { getCurrentSurveyStaff } from "@/lib/survey/session";

export async function getOperatorContext() {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "operator") {
    return { login: <OperatorLogin />, staff: null as null };
  }
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const stores = await store.listStores();
  return { dataset: buildOperatorDataset(stores), staff, store, stores };
}

function OperatorLogin() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-sm font-semibold text-coral">商场店铺调研系统营运后台</p>
        <SurveyLoginForm title="营运账号登录" />
      </div>
    </main>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-paper text-ink/58">
          <tr>{headers.map((item) => <th className="px-3 py-2" key={item}>{item}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-ink/8" key={index}>
              {row.map((cell, cellIndex) => <td className="px-3 py-2" key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
