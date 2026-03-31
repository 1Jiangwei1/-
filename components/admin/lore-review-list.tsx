"use client";

import { useEffect, useState } from "react";

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type ReviewItem = {
  id: string;
  entryId: string;
  entryTitle: string;
  createdAt: string;
  requesterName: string;
  changeNote: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function LoreReviewList() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  async function loadItems() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/lore/review", {
        method: "GET",
        cache: "no-store",
      });
      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            items?: ReviewItem[];
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text:
            data?.message ??
            data?.error ??
            "审核列表加载失败，请稍后重试。",
        });
        setItems([]);
        return;
      }

      setItems(data?.items ?? []);
    } catch {
      setNotice({
        type: "error",
        text: "审核列表加载失败，请检查网络后重试。",
      });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActingId(id);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/lore/review/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? data?.error ?? "审核操作失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? (action === "approve" ? "已通过申请" : "已驳回申请"),
      });

      await loadItems();
    } catch {
      setNotice({
        type: "error",
        text: "审核操作失败，请检查网络后重试。",
      });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            正在加载待审核申请...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            暂无待审核申请
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/70">
                <tr className="text-left text-sm text-zinc-400">
                  <th className="px-6 py-4 font-medium">词条标题</th>
                  <th className="px-6 py-4 font-medium">提交时间</th>
                  <th className="px-6 py-4 font-medium">提交人</th>
                  <th className="px-6 py-4 font-medium">变更说明</th>
                  <th className="px-6 py-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-100">
                      {item.entryTitle}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {item.requesterName}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {item.changeNote}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => handleAction(item.id, "approve")}
                          className="inline-flex items-center rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingId === item.id ? "处理中..." : "通过"}
                        </button>
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => handleAction(item.id, "reject")}
                          className="inline-flex items-center rounded-lg border border-red-700 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:border-red-500 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingId === item.id ? "处理中..." : "驳回"}
                        </button>
                      </div>
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
