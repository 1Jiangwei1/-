import Link from "next/link";

import LorePermissionManager from "@/components/admin/lore-permission-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyLoreCapability } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

export default async function AdminLorePermissionsPage() {
  const user = await getCurrentUser();
  const canOpenPermissions = await hasAnyLoreCapability(user?.id ?? null, "ADMIN");

  if (!canOpenPermissions) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">没有权限分配权限</h1>
        <p className="text-sm text-zinc-400">
          只有 OWNER、站点 ADMIN 或具有世界观 ADMIN 权限的用户，才能分配世界观权限。
        </p>
      </div>
    );
  }

  const [users, items] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.loreEditorPermission.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/lore" className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100">
            返回词条管理
          </Link>
          <Link href="/admin/lore/review" className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100">
            前往审核列表
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">世界观权限分配</h1>
        <p className="text-sm text-zinc-400">
          登录用户默认拥有查看和提交建议能力，这里只需要额外分配编辑、审核或管理权限。
        </p>
      </div>

      <LorePermissionManager
        users={users}
        items={items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
