"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getLoreCategoryLabel } from "@/lib/lore/category-label";

type BoardPayload = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    score: number;
    loreEntryId: string;
    title: string;
    category: string;
  }>;
  candidates: Array<{
    id: string;
    title: string;
    category: string;
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
}: {
  boards: BoardPayload[];
}) {
  const router = useRouter();
  const [keywords, setKeywords] = useState<Record<string, string>>(() =>
    boards.reduce<Record<string, string>>((result, board) => {
      result[board.id] = "";
      return result;
    }, {}),
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const filteredBoards = useMemo(
    () =>
      boards.map((board) => {
        const keyword = keywords[board.id]?.trim().toLowerCase() ?? "";
        const existingIds = new Set(board.items.map((item) => item.loreEntryId));

        return {
          ...board,
          candidates: board.candidates.filter((candidate) => {
            if (existingIds.has(candidate.id)) {
              return false;
            }

            if (!keyword) {
              return true;
            }

            const haystack = `${candidate.title} ${candidate.category}`.toLowerCase();
            return haystack.includes(keyword);
          }),
        };
      }),
    [boards, keywords],
  );

  async function handleAdd(boardId: string, loreEntryId: string) {
    setNotice(null);
    setSubmittingKey(`${boardId}:${loreEntryId}`);

    try {
      const response = await fetch("/api/admin/rank/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId,
          loreEntryId,
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
      setKeywords((current) => ({
        ...current,
        [boardId]: "",
      }));
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "添加失败，请检查网络后重试。",
      });
    } finally {
      setSubmittingKey(null);
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
        {filteredBoards.map((board) => (
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

              <div className="space-y-3">
                <input
                  type="search"
                  value={keywords[board.id] ?? ""}
                  onChange={(event) =>
                    setKeywords((current) => ({
                      ...current,
                      [board.id]: event.target.value,
                    }))
                  }
                  placeholder="搜索要加入榜单的人物词条"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                />

                {board.candidates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-8 text-center text-sm text-zinc-400">
                    没有找到可加入的人物词条，换个关键词试试。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {board.candidates.slice(0, 8).map((candidate) => {
                      const currentKey = `${board.id}:${candidate.id}`;
                      return (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-medium text-zinc-100">
                              {candidate.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {getLoreCategoryLabel(candidate.category)}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={submittingKey === currentKey}
                            onClick={() => handleAdd(board.id, candidate.id)}
                            className="inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingKey === currentKey ? "添加中..." : "添加到榜单"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {board.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-400">
                  当前榜单还没有对象，请先从人物词条中搜索并添加。
                </div>
              ) : (
                <div className="space-y-3">
                  {board.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold text-zinc-200">
                          #{index + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-zinc-100">
                            {item.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {getLoreCategoryLabel(item.category)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">当前分数</p>
                        <p className="text-lg font-semibold text-zinc-100">
                          {item.score}
                        </p>
                      </div>
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
