import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerationForm } from "@/components/customer/GenerationForm";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { requireUser } from "@/lib/auth/session";
import { sceneDefinitions, type SceneKey } from "@/lib/domain/scenes";

export default async function GenerateScenePage({ params }: { params: Promise<{ scene: string }> }) {
  const profile = await requireUser();
  const { scene } = await params;

  if (!Object.keys(sceneDefinitions).includes(scene)) {
    notFound();
  }

  const sceneKey = scene as SceneKey;

  return (
    <CustomerShell profile={profile}>
      <Link className="text-sm font-medium text-moss" href="/app">
        返回功能选择
      </Link>
      <section className="mt-5">
        <p className="text-sm font-semibold text-coral">内容生成</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">{sceneDefinitions[sceneKey].label}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">门店资料会自动带入，客户只需要填写本次活动或项目信息。</p>
      </section>
      <div className="mt-5">
        <GenerationForm scene={sceneKey} storeType={profile.storeType} />
      </div>
    </CustomerShell>
  );
}
