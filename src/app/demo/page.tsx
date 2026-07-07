import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { sceneDefinitions } from "@/lib/domain/scenes";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm font-medium text-moss" href="/">
          返回首页
        </Link>
        <section className="mt-6 border-b border-ink/10 pb-7">
          <p className="text-sm font-semibold text-coral">功能演示</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">看看7类文案能生成什么</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/65">
            登录后填写项目名称、目标客户和宣传目的，系统会结合门店类型与门店资料生成可复制、可修改的中文文案，并提示常见敏感表达风险。
          </p>
        </section>
        <section className="grid gap-4 py-7 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(sceneDefinitions).map((scene) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={scene.label}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-moss" />
                <h2 className="font-semibold text-ink">{scene.label}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/62">{scene.description}</p>
            </article>
          ))}
        </section>
        <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row">
          <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-coral px-5 py-2 font-medium text-white" href="/#apply">
            免费申请7天体验账号
          </Link>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-5 py-2 font-medium text-ink" href="/login">
            已有账号？立即登录
          </Link>
        </div>
      </div>
    </main>
  );
}
