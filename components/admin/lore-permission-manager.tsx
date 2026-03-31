"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PermissionItem = {
  id: string;
  userId: string;
  level: string;
  scopeType: string;
  scopeValue: string | null;
  createdAt: string;
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

const LEVEL_OPTIONS = ["EDIT", "REVIEW", "ADMIN"];
const SCOPE_OPTIONS = ["GLOBAL", "CATEGORY", "ENTRY"];

const LEVEL_LABELS: Record<string, string> = {
  VIEW: "查看：只能查看词条",
  SUGGEST: "建议：可提交修改建议，不能直接改",
  EDIT: "编辑：可直接修改词条",
  REVIEW: "审核：可审核修改建议",
  ADMIN: "管理：可编辑、审核，并分配权限",
};

const SCOPE_LABELS: Record<string, string> = {
  GLOBAL: "全站世界观",
  CATEGORY: "指定分类",
  ENTRY: "单个词条",
};

function getLevelLabel(level: string) {
  return LEVEL_LABELS[level] ?? level;
}

function getScopeLabel(scopeType: string) {
  return SCOPE_LABELS[scopeType] ?? scopeType;
}

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function LorePermissionManager({
  users,
  items,
}: {
  users: UserOption[];
  items: PermissionItem[];
}) {
  const visibleItems = items.filter(
    (item) => item.level === "EDIT" || item.level === "REVIEW" || item.level === "ADMIN"
  );
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [level, setLevel] = useState("EDIT");
  const [scopeType, setScopeType] = useState("GLOBAL");
  const [scopeValue, setScopeValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/lore/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          level,
          scopeType,
          scopeValue: scopeType === "GLOBAL" ? null : scopeValue,
        }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            item?: PermissionItem;
            error?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text: data?.error ?? data?.message ?? "权限分配失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: "权限已保存，刷新后立即生效。",
      });
      setScopeValue("");
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "权限分配失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
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

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">授权用户</label>
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">权限级别</label>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          >
            {LEVEL_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {getLevelLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">权限范围</label>
          <select
            value={scopeType}
            onChange={(event) => setScopeType(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          >
            {SCOPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {getScopeLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">范围值</label>
          <input
            value={scopeValue}
            onChange={(event) => setScopeValue(event.target.value)}
            disabled={scopeType === "GLOBAL"}
            placeholder={
              scopeType === "CATEGORY"
                ? "填写分类，例如：人物、势力、法宝"
                : scopeType === "ENTRY"
                  ? "填写要授权的词条 ID"
                  : "全站世界观不需要填写"
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 disabled:opacity-60"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !userId}
            className="inline-flex items-center rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "保存中..." : "保存权限"}
          </button>
        </div>
      </form>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        {visibleItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            暂无已分配权限
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/70">
                <tr className="text-left text-sm text-zinc-400">
                  <th className="px-6 py-4 font-medium">用户</th>
                  <th className="px-6 py-4 font-medium">角色</th>
                  <th className="px-6 py-4 font-medium">权限</th>
                  <th className="px-6 py-4 font-medium">范围</th>
                  <th className="px-6 py-4 font-medium">范围值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-200">
                {visibleItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-100">
                      {item.user.username || item.user.email}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{item.user.role}</td>
                    <td className="px-6 py-4 text-zinc-300">{getLevelLabel(item.level)}</td>
                    <td className="px-6 py-4 text-zinc-300">{getScopeLabel(item.scopeType)}</td>
                    <td className="px-6 py-4 text-zinc-300">
                      {item.scopeValue ?? "全站世界观"}
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
