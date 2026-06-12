import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { WechatQrPanel } from "@/components/WechatQrPanel";
import { OpeningApplicationForm } from "@/components/public/OpeningApplicationForm";

const storeTypes = [
  "中医馆 / 中医诊所",
  "推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆",
  "口腔门诊",
  "医院科室 / 综合门诊",
  "健康管理中心 / 体检中心",
];

const scenes = [
  ["小红书文案", "快速生成标题、封面文字、正文、标签和评论区引导，并进行敏感词提示。"],
  ["朋友圈文案", "生成适合老板、店长、前台发布的朋友圈内容，减少硬广感。"],
  ["公众号文案", "生成中短篇科普文章，适合门店公众号日常更新。"],
  ["美团 / 点评团单", "生成团单标题、副标题、适合人群、项目亮点和购买须知。"],
  ["点评好评话术", "生成自然真实的好评参考话术，避免夸大宣传。"],
  ["私域成交话术", "生成微信沟通回复话术，帮助前台更自然地引导咨询和预约。"],
];

const plans = [
  ["基础月卡", "19 元 / 月", "小红书、朋友圈、公众号，每天 30 次"],
  ["标准月卡", "39 元 / 月", "全部 6 个功能，每天 30 次"],
  ["正式年卡", "168 元 / 年", "全部 6 个功能，每天 30 次"],
  ["代运营陪跑", "面议", "账号诊断、内容规划、人工交付支持"],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:py-14">
        <div className="flex-1">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-moss/25 bg-white px-3 py-1 text-sm text-moss">
            <Sparkles className="h-4 w-4" />
            本地健康门店获客助手
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink sm:text-5xl">
            本地健康门店获客助手
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">
            用 AI 帮中医馆、推拿馆、口腔门诊、健康管理中心快速生成小红书、朋友圈、公众号、美团团单和私域话术。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 font-medium text-white shadow-soft"
              href="#apply"
            >
              申请试用
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink/15 bg-white px-5 py-3 font-medium text-ink"
              href="/login"
            >
              已有账号登录
            </Link>
          </div>
          <Link className="mt-4 inline-flex text-sm font-medium text-moss" href="#plans">
            查看套餐价格
          </Link>
        </div>

        <WechatQrPanel />
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          {storeTypes.map((type) => (
            <div key={type} className="flex items-center gap-2 text-sm text-ink/78">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-moss" />
              {type}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="features">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-coral">核心功能</p>
          <h2 className="text-2xl font-semibold text-ink">6 个高频获客内容场景</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map(([scene, detail]) => (
            <div key={scene} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold text-ink">{scene}</p>
              <p className="mt-3 text-sm leading-6 text-ink/64">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white" id="plans">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-coral">套餐价格</p>
            <h2 className="text-2xl font-semibold text-ink">先人工开通，再使用工具</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {plans.map(([name, price, detail]) => (
              <div key={name} className="rounded-lg border border-ink/10 bg-paper p-5">
                <p className="font-semibold text-ink">{name}</p>
                <p className="mt-3 text-2xl font-semibold text-coral">{price}</p>
                <p className="mt-3 text-sm leading-6 text-ink/65">{detail}</p>
                {name === "标准月卡" ? (
                  <span className="mt-4 inline-flex rounded-full bg-moss px-3 py-1 text-xs font-medium text-white">
                    推荐
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-md border border-moss/20 bg-moss/8 p-4 text-sm leading-6 text-ink/72">
            正式年卡 168 元 / 年，平均每天不到 0.5 元。本工具不承诺直接带来固定订单或固定曝光，但可以帮助门店把内容、团单、好评、私域话术等线上获客基础动作标准化。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="apply">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <OpeningApplicationForm />
          <WechatQrPanel mode="inline" />
        </div>
      </section>
    </main>
  );
}
