import Link from "next/link";
import { ArrowRight, MapPinned, SearchCheck, Store } from "lucide-react";
import SurveyPage from "./survey/page";
import { getAppMode } from "@/lib/app-mode";

export default function HomePage({ searchParams }: { searchParams: Promise<{ error?: string; periodMonth?: string; q?: string; storeId?: string; submitted?: string }> }) {
  if (getAppMode() === "survey") return <SurveyPage searchParams={searchParams} />;
  return (
    <main className="public-home">
      <header className="public-header"><Link href="/">门店线上运营与AI搜索优化</Link><Link className="ops-button ops-button-secondary" href="/login">已有账号登录</Link></header>
      <section className="public-hero">
        <div><h1>把门店的线上运营，做得更清楚、更持续。</h1><p>面向本地门店的代运营服务，整理机构资料、推进内容任务，并逐步建立适合 AI 搜索理解的真实信息结构。</p><div className="public-actions"><a className="ops-button ops-button-primary" href="#contact">联系沟通</a><Link className="ops-text-link" href="/login">运营人员登录 <ArrowRight size={16} /></Link></div></div>
        <div className="public-service-panel"><article><Store /><strong>线上门店代运营</strong><p>围绕门店真实经营资料安排内容、交付与复盘。</p></article><article><SearchCheck /><strong>AI 搜索优化</strong><p>持续整理可验证的信息、服务与关键词资料。</p></article><article><MapPinned /><strong>机构资料管理</strong><p>一个客户可以管理多个门店或服务机构。</p></article></div>
      </section>
      <section className="public-contact" id="contact"><div><h2>先了解门店目前的情况</h2><p>微信号：<strong>Montes_Runa</strong></p><small>真实微信二维码素材暂未配置，当前仅展示微信号。</small></div><a className="ops-button ops-button-primary" href="weixin://">打开微信</a></section>
    </main>
  );
}
