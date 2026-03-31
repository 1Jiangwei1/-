import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/current-user";
import { syncUserNotifications } from "@/lib/notifications/sync-user-notifications";
import { prisma } from "@/lib/prisma";

import { NotificationList } from "@/components/user/notification-list";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">通知</h1>
          <p className="mt-3 text-sm text-zinc-400">请先登录后查看你的通知。</p>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              去登录
            </Link>
          </div>
        </div>
      </main>
    );
  }

  await syncUserNotifications({ userId: currentUser.id });

  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-100">通知</h1>
            <p className="mt-2 text-sm text-zinc-400">
              这里会汇总帖子互动、战力榜动态和修改申请结果。
            </p>
          </div>
          <Link
            href="/me"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            返回我的页面
          </Link>
        </div>
      </section>

      <NotificationList
        initialNotifications={notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
