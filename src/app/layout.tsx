import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "本地健康门店获客助手",
  description: "面向中医馆、推拿馆、口腔门诊、健康管理中心和宠物医院的 AI 获客文案工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
