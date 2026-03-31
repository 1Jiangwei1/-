import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyLoreCapability } from "@/lib/lore/permission";

export default async function AdminLoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-100">需要先登录</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          世界观后台只对已登录用户开放，请先登录后再继续操作。
        </p>
        <div className="mt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  const canEnterLoreAdmin = await hasAnyLoreCapability(user.id, "VIEW");

  if (!canEnterLoreAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-100">没有世界观后台权限</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          你当前没有世界观后台访问权限，无法进入词条管理相关页面。
        </p>
      </div>
    );
  }

  return <div className="space-y-6">{children}</div>;
}
