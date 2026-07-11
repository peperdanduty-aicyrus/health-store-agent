import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { canGenerate } from "@/lib/domain/permissions";
import { sceneDefinitions } from "@/lib/domain/scenes";
import type { Profile } from "@/lib/data/types";
import { chinaDate } from "@/lib/ops/date";

export function SceneCardGrid({ profile, todayCount }: { profile: Profile; todayCount: number }) {
  const today = chinaDate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(sceneDefinitions).map(([scene, meta]) => {
        const permission = canGenerate({ profile, scene: scene as keyof typeof sceneDefinitions, today, todayCount });

        return (
          <Link
            className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:border-moss/40"
            href={`/app/generate/${scene}`}
            key={scene}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{meta.label}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {permission.allowed ? meta.description : "当前状态暂不可直接生成。"}
                </p>
              </div>
              {permission.allowed ? <Sparkles className="h-5 w-5 text-coral" /> : <LockKeyhole className="h-5 w-5 text-ink/35" />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
