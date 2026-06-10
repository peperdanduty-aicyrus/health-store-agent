import Image from "next/image";
import { LockKeyhole } from "lucide-react";

type WechatQrPanelProps = {
  mode?: "card" | "inline";
};

export function WechatQrPanel({ mode = "card" }: WechatQrPanelProps) {
  if (mode === "inline") {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-5">
        <div className="mx-auto w-36 rounded-md border border-ink/10 bg-paper p-2">
          <Image
            src="/images/wechat-qr.png"
            alt="个人微信二维码"
            width={128}
            height={128}
            className="h-32 w-32 rounded"
          />
        </div>
        <p className="mt-4 text-center text-sm font-medium text-ink">添加微信，人工开通体验权限。</p>
        <p className="mt-2 text-center text-xs leading-5 text-ink/58">提交申请后再添加即可，不做自动付款。</p>
      </div>
    );
  }

  return (
    <aside className="w-full rounded-lg border border-ink/10 bg-white p-5 shadow-soft lg:max-w-xs">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-moss/10 p-2 text-moss">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">人工开通体验权限</h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">第一版不开放自助注册和自动支付，提交申请后添加微信沟通。</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-md border border-ink/10 bg-paper p-3">
        <Image
          src="/images/wechat-qr.png"
          alt="个人微信二维码"
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded"
          priority
        />
        <p className="text-sm leading-6 text-ink/70">扫码添加微信，备注门店类型，人工确认试用权限。</p>
      </div>
      <p className="mt-4 text-sm font-medium text-ink">添加微信，人工开通体验权限。</p>
    </aside>
  );
}

