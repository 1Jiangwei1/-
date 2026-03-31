"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function markOneRead(id: string) {
    setPendingId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "通知状态更新失败");
      }

      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setMessage(data?.message || "已标记为已读");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "通知状态更新失败");
    } finally {
      setPendingId(null);
    }
  }

  async function markAllRead() {
    setPendingId("all");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "全部标记已读失败");
      }

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setMessage(data?.message || "已全部标记为已读");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "全部标记已读失败");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">通知列表</h2>
          <p className="mt-1 text-sm text-zinc-400">
            这里会显示与你发布、投票、修改申请相关的最新动态。
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={pendingId === "all" || notifications.length === 0}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          全部标记已读
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 px-6 py-10 text-center text-sm text-zinc-400">
          暂时还没有通知。
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-3xl border px-5 py-5 ${
                notification.isRead
                  ? "border-zinc-800 bg-zinc-950/70"
                  : "border-zinc-700 bg-zinc-900/80"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-zinc-100">{notification.title}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        notification.isRead
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {notification.isRead ? "已读" : "未读"}
                    </span>
                  </div>
                  {notification.body ? (
                    <p className="mt-2 text-sm text-zinc-400">{notification.body}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-500">{formatDate(notification.createdAt)}</p>
                </div>
                {!notification.isRead ? (
                  <button
                    type="button"
                    onClick={() => markOneRead(notification.id)}
                    disabled={pendingId === notification.id}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    标记已读
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
