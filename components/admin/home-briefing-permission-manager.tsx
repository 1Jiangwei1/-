"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PermissionItem = {
  id: string;
  createdAt: string;
  userId: string;
  user: {
    username: string;
    email: string;
    role: string;
  };
};

type UserOption = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function HomeBriefingPermissionManager({
  users,
  items,
}: {
  users: UserOption[];
  items: PermissionItem[];
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(normalizedKeyword) ||
        user.email.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [keyword, users]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/briefing/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "授权失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "已完成授权。",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "授权失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(targetUserId: string, username: string) {
    const confirmed = window.confirm(`确认撤销 ${username} 的快报编辑权限吗？`);
    if (!confirmed) {
      return;
    }

    setNotice(null);
    setRemovingUserId(targetUserId);

    try {
      const response = await fetch("/api/admin/briefing/permissions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "撤销失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "已撤销权限。",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "撤销失败，请检查网络后重试。",
      });
    } finally {
      setRemovingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          className={
            notice.type === "success"
              ? "rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
              : "rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:grid-cols-[1fr_auto]"
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">授权用户</label>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索用户名或邮箱"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            />
          </div>
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          >
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-zinc-500">未找到匹配用户</p>
          ) : null}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting || !userId}
            className="inline-flex items-center rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "授权中..." : "授予快报编辑权限"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            暂无已授权用户
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/70">
                <tr className="text-left text-sm text-zinc-400">
                  <th className="px-6 py-4 font-medium">用户</th>
                  <th className="px-6 py-4 font-medium">角色</th>
                  <th className="px-6 py-4 font-medium">邮箱</th>
                  <th className="px-6 py-4 font-medium">授权时间</th>
                  <th className="px-6 py-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-100">
                      {item.user.username}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{item.user.role}</td>
                    <td className="px-6 py-4 text-zinc-300">{item.user.email}</td>
                    <td className="px-6 py-4 text-zinc-300">{item.createdAt}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={removingUserId === item.userId}
                        onClick={() => handleRemove(item.userId, item.user.username)}
                        className="inline-flex items-center rounded-lg border border-red-700 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:border-red-500 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingUserId === item.userId ? "撤销中..." : "撤销权限"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
