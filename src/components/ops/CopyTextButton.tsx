"use client";

import { useState } from "react";

export function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="ops-button ops-button-secondary" type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? "已复制" : "复制汇报"}</button>;
}
