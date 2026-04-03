import Link from "next/link";
import { UserRole } from "@prisma/client";

import HomeBriefingPermissionManager from "@/components/admin/home-briefing-permission-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function AdminBriefingPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.OWNER) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">
          没有快报权限管理权限
        </h1>
        <p className="text-sm text-zinc-400">
          只有超级管理员可以分配或撤销玄鉴快报的编辑权限。
        </p>
      </div>
    );
  }

  const [users, items] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          not: UserRole.OWNER,
        },
      },
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
    prisma.homeBriefingEditorPermission.findMany({
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
          <Link
            href="/"
            className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
          >
            返回首页
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          玄鉴快报权限
        </h1>
        <p className="text-sm text-zinc-400">
          这里只有超级管理员可见，用于控制谁能直接修改首页“玄鉴快报”。
        </p>
      </div>

      <HomeBriefingPermissionManager
        users={users}
        items={items.map((item) => ({
          ...item,
          createdAt: formatDate(item.createdAt),
        }))}
      />
    </div>
  );
}
