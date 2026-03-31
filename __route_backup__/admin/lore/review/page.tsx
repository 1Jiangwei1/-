import Link from "next/link";

import LoreReviewList from "@/components/admin/lore-review-list";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyLoreCapability } from "@/lib/lore/permission";

export default async function AdminLoreReviewPage() {
  const user = await getCurrentUser();
  const canReview = await hasAnyLoreCapability(user?.id ?? null, "REVIEW");

  if (!canReview) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">没有审核权限</h1>
        <p className="text-sm text-zinc-400">
          你当前没有 REVIEW 及以上的世界观权限，不能进入审核列表。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/lore"
            className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
          >
            返回词条管理
          </Link>
          <Link
            href="/admin/lore/permissions"
            className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
          >
            权限分配
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          修改申请审核
        </h1>
        <p className="text-sm text-zinc-400">
          查看待审核的词条修改建议，并决定通过或驳回。
        </p>
      </div>

      <LoreReviewList />
    </div>
  );
}
