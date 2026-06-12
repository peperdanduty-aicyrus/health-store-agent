import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoGenerationForm } from "@/components/demo/DemoGenerationForm";
import { DemoShell } from "@/components/demo/DemoShell";
import { demoDailyLimit, demoUsageCookieName, parseDemoUsage } from "@/lib/demo/usage";
import { sceneDefinitions, type SceneKey } from "@/lib/domain/scenes";

export default async function DemoGenerateScenePage({ params }: { params: Promise<{ scene: string }> }) {
  const { scene } = await params;
  if (!Object.keys(sceneDefinitions).includes(scene)) {
    notFound();
  }

  const cookieStore = await cookies();
  const usage = parseDemoUsage(cookieStore.get(demoUsageCookieName)?.value);
  const remaining = Math.max(0, demoDailyLimit - usage.count);
  const sceneKey = scene as SceneKey;

  return (
    <DemoShell remaining={remaining}>
      <Link className="text-sm font-medium text-moss" href="/demo">
        返回 Demo 首页
      </Link>
      <section className="mt-5">
        <p className="text-sm font-semibold text-coral">免登录生成</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">{sceneDefinitions[sceneKey].label}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          使用演示门店资料生成内容。本浏览器每天可生成 {demoDailyLimit} 次，适合发给 ChatGPT 或客户先体验核心流程。
        </p>
      </section>
      <div className="mt-5">
        <DemoGenerationForm scene={sceneKey} />
      </div>
    </DemoShell>
  );
}
