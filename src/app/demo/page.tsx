import { cookies } from "next/headers";
import Link from "next/link";
import { DemoShell } from "@/components/demo/DemoShell";
import { demoDailyLimit, demoUsageCookieName, parseDemoUsage } from "@/lib/demo/usage";
import { sceneDefinitions } from "@/lib/domain/scenes";

export default async function DemoPage() {
  const cookieStore = await cookies();
  const usage = parseDemoUsage(cookieStore.get(demoUsageCookieName)?.value);
  const remaining = Math.max(0, demoDailyLimit - usage.count);

  return (
    <DemoShell remaining={remaining}>
      <section className="mb-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-coral">给 ChatGPT 或外部测试者使用</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">免登录体验入口</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          不需要账号密码，本浏览器每天可生成 {demoDailyLimit} 次。生成结果会自动处理常见敏感表达，并提供复制按钮。
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(sceneDefinitions).map(([scene, meta]) => (
          <Link
            className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:border-moss/40"
            href={`/demo/generate/${scene}`}
            key={scene}
          >
            <p className="text-lg font-semibold text-ink">{meta.label}</p>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              {remaining > 0 ? "可免登录生成，适合测试文案质量和复制体验。" : "今日 Demo 次数已用完，明天恢复。"}
            </p>
          </Link>
        ))}
      </div>
    </DemoShell>
  );
}
