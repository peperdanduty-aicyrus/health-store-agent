import Link from "next/link";
import { getPlanConfig } from "@/lib/domain/plans";
import type { Profile } from "@/lib/data/types";
import { CreateMerchantForm } from "./CreateMerchantForm";
import { GoodReviewExtensionButton } from "./GoodReviewExtensionButton";

export function UserManagement({ todayCounts = {}, users }: { todayCounts?: Record<string, number>; users: Profile[] }) {
  return (
    <section className="space-y-6">
      <CreateMerchantForm />
      <h2 className="text-2xl font-semibold text-ink">商家账号</h2>
      <div className="mt-5 overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              {["手机号", "门店", "类型", "套餐", "来源渠道", "每日次数", "到期", "启用状态", "今日次数", "操作"].map((header) => (
                <th className="px-4 py-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "user")
              .map((user) => (
                <tr className="border-t border-ink/8" key={user.id}>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.storeName}</td>
                  <td className="px-4 py-3">{user.storeType}</td>
                  <td className="px-4 py-3">{getPlanConfig(user.planName).label}</td>
                  <td className="px-4 py-3">{user.sourceChannel}</td>
                  <td className="px-4 py-3">{user.dailyLimit}</td>
                  <td className="px-4 py-3">{user.expiresAt}</td>
                  <td className="px-4 py-3">{user.disabled ? "已禁用" : "已启用"}</td>
                  <td className="px-4 py-3">{todayCounts[user.id] || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Link className="font-medium text-moss" href={`/agent-admin/users/${user.id}`}>
                        管理
                      </Link>
                      <GoodReviewExtensionButton userId={user.id} />
                    </div>
                  </td>
                </tr>
              ))}
            {users.filter((user) => user.role === "user").length === 0 ? (
              <tr className="border-t border-ink/8">
                <td className="px-4 py-5 text-ink/58" colSpan={10}>
                  暂无商家账号。可以用上面的表单主动创建。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
