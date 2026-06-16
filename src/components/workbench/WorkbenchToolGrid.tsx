import Link from "next/link";
import { Clock, Image, Megaphone, Soup, History } from "lucide-react";
import type { ComponentType } from "react";
import { workbenchToolDefinitions, workbenchToolTypes } from "@/lib/domain/workbench";
import type { WorkbenchGenerationType } from "@/lib/data/types";

const icons: Record<WorkbenchGenerationType | "history", ComponentType<{ className?: string }>> = {
  history: History,
  mealbox_video: Soup,
  moments_library: Clock,
  poster_prompt: Image,
  promotion_copy: Megaphone,
};

export function WorkbenchToolGrid({ basePath = "/lvminglei", showHistory = true }: { basePath?: string; showHistory?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workbenchToolTypes.map((type) => {
        const Icon = icons[type];
        const tool = workbenchToolDefinitions[type];
        return (
          <Link className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:border-moss/40" href={`${basePath}/tools/${type}`} key={type}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{tool.label}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{tool.description}</p>
              </div>
              <Icon className="h-5 w-5 shrink-0 text-coral" />
            </div>
          </Link>
        );
      })}
      {showHistory ? (
        <Link className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:border-moss/40" href={`${basePath}/history`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">历史记录</p>
              <p className="mt-2 text-sm leading-6 text-ink/60">查看、复制、删除或基于历史输入重新生成。</p>
            </div>
            <History className="h-5 w-5 shrink-0 text-coral" />
          </div>
        </Link>
      ) : null}
    </div>
  );
}
