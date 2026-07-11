"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ops-error-page">
      <section className="ops-error-card">
        <h1>页面加载没有成功</h1>
        <p>请刷新后重试。若仍无法使用，请联系管理员。</p>
        <button className="ops-button ops-button-primary" onClick={reset} type="button">重新加载</button>
      </section>
    </main>
  );
}
