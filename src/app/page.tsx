import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";

const storeTypes = [
  "中医馆 / 中医诊所",
  "推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆",
  "口腔门诊",
  "医院科室 / 综合门诊",
  "健康管理中心 / 体检中心",
  "宠物医院",
];

const scenes = [
  "小红书文案",
  "朋友圈文案",
  "公众号文案",
  "美团 / 点评团单",
  "点评好评话术",
  "私域成交话术",
];

const plans = [
  ["免费试用", "0 元 / 3 天", "全部功能，每天 5 次"],
  ["基础月卡", "19 元 / 月", "小红书、朋友圈、公众号，每天 30 次"],
  ["标准月卡", "39 元 / 月", "全部 6 个功能，每天 30 次"],
  ["内测年卡", "168 元 / 年", "全部 6 个功能，每天 30 次"],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:py-14">
        <div className="flex-1">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-moss/25 bg-white px-3 py-1 text-sm text-moss">
            <Sparkles className="h-4 w-4" />
            本地健康门店内容获客 MVP
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink sm:text-5xl">
            本地健康门店获客助手
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">
            用 AI 帮中医馆、推拿馆、口腔门诊、健康管理中心、宠物医院快速生成小红书、朋友圈、公众号、美团团单和私域话术。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 font-medium text-white shadow-soft"
              href="#trial"
            >
              申请 3 天免费试用
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink/15 bg-white px-5 py-3 font-medium text-ink"
              href="#plans"
            >
              查看套餐价格
            </Link>
          </div>
        </div>

        <aside className="w-full rounded-lg border border-ink/10 bg-white p-5 shadow-soft lg:max-w-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-moss/10 p-2 text-moss">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">人工开通体验权限</h2>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                第一版不开放自助注册和自动支付，提交申请后添加微信沟通。
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-md border border-ink/10 bg-paper p-3">
            <Image
              src="/images/wechat-qr.png"
              alt="个人微信二维码"
              width={360}
              height={360}
              className="h-auto w-full rounded"
              priority
            />
          </div>
          <p className="mt-4 text-center text-sm font-medium text-ink">
            添加微信，人工开通体验权限。
          </p>
        </aside>
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
          {scenes.map((scene) => (
            <div key={scene} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold text-ink">{scene}</p>
              <p className="mt-3 text-sm leading-6 text-ink/64">
                后续接入统一生成 API，生成后自动做本地敏感词风险提示。
              </p>
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
            内测年卡 168 元 / 年，平均每天不到 0.5 元。本工具不承诺直接带来固定订单或固定曝光，但可以帮助门店把内容、团单、好评、私域话术等线上获客基础动作标准化。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="trial">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-coral">试用申请</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">提交门店信息后人工开通</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["门店名称", "门店类型", "城市 / 区域", "联系人", "手机号", "微信号"].map((label) => (
                <label key={label} className="text-sm font-medium text-ink/75">
                  {label}
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-ink/12 bg-paper px-3 outline-none focus:border-moss"
                    placeholder={label}
                  />
                </label>
              ))}
            </div>
            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 font-medium text-white sm:w-auto">
              申请 3 天免费试用
            </button>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <Image
              src="/images/wechat-qr.png"
              alt="个人微信二维码"
              width={360}
              height={360}
              className="h-auto w-full rounded-md"
            />
            <p className="mt-4 text-center text-sm font-medium text-ink">
              添加微信，人工开通体验权限。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
