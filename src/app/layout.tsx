import type { Metadata } from "next";
import { getAppMetadata } from "@/lib/app-mode";
import "./globals.css";

export function generateMetadata(): Metadata {
  const appMetadata = getAppMetadata();
  return {
    title: appMetadata.title,
    description: appMetadata.description,
    openGraph: {
      title: appMetadata.title,
      description: appMetadata.description,
    },
  };
}

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
