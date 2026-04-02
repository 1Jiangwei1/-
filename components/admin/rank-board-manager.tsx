"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getLoreCategoryLabel } from "@/lib/lore/category-label";

type BoardPayload = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    score: number;
    title: string;
    description: string | null;
    customTitle: string | null;
    category: string | null;
    loreEntryTitle: string | null;
  }>;
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

export default function RankBoardManager({
  boards,
  canModerateRank,
}: {
  boards: BoardPayload[];
  canModerateRank: boolean;
}) {
  const router = useRouter();
  const [titles, setTitles] = useState<Record<string, string>>(() =>
    boards.reduce<Record<string, string>>((result, board) => {
      result[board.id] = "";
      return result;
    }, {})
  );
  const [descriptions, setDescriptions] = useState<Record<string, string>>(() =>
    boards.reduce<Record<string, string>>((result, board) => {
      result[board.id] = "";
      return result;
    }, {})
  );
  const [itemDescriptions, setItemDescriptions] = useState<Record<string, string>>(() =>
    boards.reduce<Record<string, string>>((result, board) => {
      for (const item of board.items) {
        result[item.id] = item.description ?? "";
      }
      return result;
    }, {})
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [submittingBoardId, setSubmittingBoardId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  async function handleAdd(boardId: string) {
    setNotice(null);

    const title = titles[boardId]?.trim() ?? "";
    const description = descriptions[boardId]?.trim() ?? "";

    if (!title) {
      setNotice({
        type: "error",
        text: "请先填写榜项名称。",
      });
      return;
    }

    setSubmittingBoardId(boardId);

    try {
      const response = await fetch("/api/admin/rank/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId,
          title,
          description: description || undefined,
        }),
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
          text: data?.message ?? "添加失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "已成功加入榜单。",
      });
      setTitles((current) => ({ ...current, [boardId]: "" }));
      setDescriptions((current) => ({ ...current, [boardId]: "" }));
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "添加失败，请检查网络后重试。",
      });
    } finally {
      setSubmittingBoardId(null);
    }
  }

  async function handleDelete(itemId: string, itemTitle: string) {
    const confirmed = window.confirm(`确认删除“${itemTitle}”吗？`);
    if (!confirmed) {
      return;
    }

    setNotice(null);
    setDeletingItemId(itemId);

    try {
      const response = await fetch(`/api/admin/rank/items/${itemId}`, {
        method: "DELETE",
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
          text: data?.message ?? "删除失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "已删除榜项。",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "删除失败，请检查网络后重试。",
      });
    } finally {
      setDeletingItemId(null);
    }
  }

  async function handleSaveDescription(itemId: string) {
    setNotice(null);
    setSavingItemId(itemId);

    try {
      const response = await fetch(`/api/admin/rank/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: itemDescriptions[itemId] ?? "",
        }),
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
          text: data?.message ?? "保存失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "已更新榜项说明。",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "保存失败，请检查网络后重试。",
      });
    } finally {
      setSavingItemId(null);
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

      <div className="grid gap-6 xl:grid-cols-2">
        {boards.map((board) => (
          <section
            key={board.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-100">
                  {board.title}
                </h2>
                <span className="text-sm text-zinc-400">
                  当前 {board.items.length} 个对象
                </span>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <div className="space-y-2">
                  <label
                    htmlFor={`custom-title-${board.id}`}
                    className="text-sm font-medium text-zinc-200"
                  >
                    榜项名称
                  </label>
                  <input
                    id={`custom-title-${board.id}`}
                    type="text"
                    value={titles[board.id] ?? ""}
                    onChange={(event) =>
                      setTitles((current) => ({
                        ...current,
                        [board.id]: event.target.value,
                      }))
                    }
                    placeholder="输入任意名称创建榜单对象"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`custom-description-${board.id}`}
                    className="text-sm font-medium text-zinc-200"
                  >
                    一句话说明（可选）
                  </label>
                  <input
                    id={`custom-description-${board.id}`}
                    type="text"
                    value={descriptions[board.id] ?? ""}
                    onChange={(event) =>
                      setDescriptions((current) => ({
                        ...current,
                        [board.id]: event.target.value,
                      }))
                    }
                    placeholder="显示在战力榜列表里的简短说明"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  />
                </div>

                <button
                  type="button"
                  disabled={submittingBoardId === board.id}
                  onClick={() => handleAdd(board.id)}
                  className="inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingBoardId === board.id ? "创建中..." : "创建榜项"}
                </button>
              </div>

              {board.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-400">
                  当前榜单还没有对象，直接输入名称即可加入。
                </div>
              ) : (
                <div className="space-y-3">
                  {board.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold text-zinc-200">
                            #{index + 1}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-zinc-100">
                              {item.title}
                            </p>
                            {item.description ? (
                              <p className="max-w-md text-xs text-zinc-400">
                                {item.description}
                              </p>
                            ) : null}
                            {item.category ? (
                              <p className="text-xs text-zinc-500">
                                {getLoreCategoryLabel(item.category)}
                              </p>
                            ) : item.loreEntryTitle ? (
                              <p className="text-xs text-zinc-500">
                                旧数据词条：{item.loreEntryTitle}
                              </p>
                            ) : item.customTitle ? (
                              <p className="text-xs text-zinc-500">手动创建</p>
                            ) : (
                              <p className="text-xs text-zinc-500">未命名对象</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">当前分数</p>
                          <p className="text-lg font-semibold text-zinc-100">
                            {item.score}
                          </p>
                        </div>
                      </div>

                      {canModerateRank ? (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1 space-y-2">
                            <label
                              htmlFor={`item-description-${item.id}`}
                              className="text-xs font-medium text-zinc-300"
                            >
                              一句话说明（可选）
                            </label>
                            <input
                              id={`item-description-${item.id}`}
                              type="text"
                              value={itemDescriptions[item.id] ?? ""}
                              onChange={(event) =>
                                setItemDescriptions((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                              placeholder="显示在战力榜列表里的简短说明"
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              disabled={savingItemId === item.id}
                              onClick={() => handleSaveDescription(item.id)}
                              className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingItemId === item.id ? "保存中..." : "保存说明"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingItemId === item.id}
                              onClick={() => handleDelete(item.id, item.title)}
                              className="inline-flex items-center rounded-xl border border-red-800/70 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingItemId === item.id ? "删除中..." : "删除"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}