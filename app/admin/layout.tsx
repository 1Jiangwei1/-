import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";

import { getOnlineCutoffDate } from "@/lib/auth/activity";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
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
          后台页面只对已登录用户开放，请先登录后再继续操作。
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

  const canEnterAdmin =
    user.role === UserRole.OWNER || user.role === UserRole.ADMIN;

  if (!canEnterAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-100">没有后台访问权限</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          整个后台仅对站点 OWNER 或 ADMIN 开放。
        </p>
      </div>
    );
  }

  const ownerStats =
    user.role === UserRole.OWNER
      ? await prisma.user.aggregate({
          _count: {
            id: true,
          },
          where: {},
        }).then(async (result) => ({
          totalUsers: result._count.id,
          onlineUsers: await prisma.user.count({
            where: {
              lastActiveAt: {
                gte: getOnlineCutoffDate(),
              },
            },
          }),
        }))
      : null;

  return (
    <div className="space-y-6">
      {ownerStats ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-100">用户统计</h2>
            <p className="text-sm text-zinc-400">
              仅最高级管理员可见，在线人数按最近 5 分钟内活跃的登录用户统计。
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-sm text-zinc-400">注册用户总数</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {ownerStats.totalUsers}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-sm text-zinc-400">当前在线人数</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {ownerStats.onlineUsers}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}
