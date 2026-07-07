import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { WechatQrPanel } from "@/components/WechatQrPanel";
import { OpeningApplicationForm } from "@/components/public/OpeningApplicationForm";
import { getAppMode } from "@/lib/app-mode";
import { sceneDefinitions } from "@/lib/domain/scenes";
import { canonicalStoreTypes } from "@/lib/domain/store-types";
import SurveyPage from "./survey/page";

const scenes = Object.values(sceneDefinitions);

const plans = [
  ["7天体验", "免费", "免费体验7天，每天30次，人工确认后发放账号，不自动扣费。"],
  ["基础月卡", "19元/月", "适合轻量使用，小红书、朋友圈、公众号等基础文案生成。"],
  ["标准月卡", "39元/月", "适合常规门店运营，支持全部内容场景，每天30次。"],
  ["正式年卡", "168元/年", "适合长期使用，支持全部内容场景，每天30次。"],
  ["代运营陪跑", "面议", "适合需要账号诊断、内容规划、人工交付支持的门店。"],
];

const trialSteps = [
  ["提交 3 项信息", "填写门店名称、门店类型、联系方式。"],
  ["添加微信确认", "人工确认门店类型和试用需求。"],
  ["发放体验账号", "免费体验7天，满意后再决定是否开通正式套餐。"],
];

const trustPoints = [
  "不自动扣费",
  "不自助付款",
  "人工确认后发放7天体验账号",
  "好评后可联系管理员延长1个月",
  "内容可复制、可修改、可用于发布前参考",
  "尽量避免夸大、敏感、违规表达",
];

export default function Home() {
  if (getAppMode() === "survey") {
    return <SurveyPage searchParams={Promise.resolve({})} />;
  }

  return (
    <main className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link className="text-sm font-semibold text-ink sm:text-base" href="/">
            本地门店获客助手
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-coral px-3 py-2 text-sm font-medium text-white shadow-soft sm:px-4"
              href="#apply"
            >
              免费申请7天体验账号
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink sm:px-4"
              href="/login"
            >
              已有账号登录
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:py-14">
        <div className="flex-1">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-moss/25 bg-white px-3 py-1 text-sm text-moss">
            <Sparkles className="h-4 w-4" />
            本地门店获客助手
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink sm:text-5xl">
            本地门店 AI 获客文案助手
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">
            帮中医馆、口腔门诊、推拿按摩SPA、美容美业、宠物医院、综合门诊、少儿推拿、餐饮门店、儿童教培，快速生成小红书、朋友圈、公众号、美团点评、好评回复、私域成交和抖音/快手短视频文案。
          </p>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-moss">
            先免费体验7天，满意后再决定是否开通正式套餐。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 font-medium text-white shadow-soft"
              href="#apply"
            >
              免费申请7天体验账号
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink/15 bg-white px-5 py-3 font-medium text-ink"
              href="/login"
            >
              已有账号？立即登录
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink/64">只需留下3项信息，人工确认后发放7天体验账号，不自动扣费。</p>
          <p className="mt-1 text-sm leading-6 text-ink/64">好评后可联系管理员延长1个月使用时间。</p>
          <Link className="mt-3 inline-flex text-sm font-medium text-moss" href="#plans">
            试用满意后可查看正式套餐
          </Link>
        </div>

        <WechatQrPanel />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="trial">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-coral">免费体验7天</p>
          <h2 className="text-2xl font-semibold text-ink">先体验7天，再决定是否开通</h2>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {trialSteps.map(([title, detail], index) => (
            <div key={title} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/64">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 rounded-md border border-moss/15 bg-moss/8 px-3 py-2 text-sm text-ink/72">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-moss" />
              {point}
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-md border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/66">
          不自动扣费，不自助付款，体验后再决定是否长期使用。生成内容只是初稿，门店可以根据实际项目、资质和服务情况进行修改后发布。
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="features">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-coral">核心功能</p>
          <h2 className="text-2xl font-semibold text-ink">7 个高频获客内容场景</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <div key={scene.label} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold text-ink">{scene.label}</p>
              <p className="mt-3 text-sm leading-6 text-ink/64">{scene.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white" id="store-types">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-coral">适合门店</p>
            <h2 className="text-2xl font-semibold text-ink">适合9类本地门店先体验</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canonicalStoreTypes.map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm text-ink/78">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-moss" />
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="apply">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <OpeningApplicationForm />
          <WechatQrPanel mode="inline" />
        </div>
      </section>

      <section className="bg-white" id="plans">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-coral">套餐价格</p>
            <h2 className="text-2xl font-semibold text-ink">试用满意后，可选择正式套餐</h2>
            <p className="text-sm leading-6 text-ink/62">免费体验7天后，如果觉得适合自己的门店，再选择是否开通正式套餐。</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            工具主要帮助门店更快完成内容、团单、好评回复、私域沟通等日常线上运营动作，生成内容可根据门店实际情况修改后发布。
          </p>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-ink/10 bg-white p-3 shadow-soft sm:hidden">
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-coral px-4 py-2 text-sm font-medium text-white" href="#apply">
          免费体验7天
        </Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-paper px-4 py-2 text-sm font-medium text-ink" href="/login">
          登录
        </Link>
      </div>
    </main>
  );
}
