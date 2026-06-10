import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const steps = [
  "登录账号",
  "选择要生成的功能",
  "填写项目名称",
  "填写目标客户",
  "选择宣传目的",
  "填写补充信息",
  "点击生成",
  "查看敏感词提示",
  "一键复制",
  "发布前结合门店实际情况人工确认",
];

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-moss" href="/">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-coral">使用教程</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">10 步完成一次内容生成</h1>
          <div className="mt-6 grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-ink/10 bg-paper px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-ink">{step}</span>
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-moss" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
