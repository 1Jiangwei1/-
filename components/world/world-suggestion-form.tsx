"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function WorldSuggestionForm({
  entryId,
  title,
  summary,
  content,
  metas,
  canSuggest,
  isLoggedIn,
}: {
  entryId: string;
  title: string;
  summary: string;
  content: string;
  metas: Array<{ key: string; value: string }>;
  canSuggest: boolean;
  isLoggedIn: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const changeNote = draft.trim();

    if (!changeNote) {
      setNotice({
        type: "error",
        text: "请先写下你的修改建议。",
      });
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/lore/change-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryId,
          patch: {
            title,
            summary,
            content,
            metas,
            changeNote,
          },
        }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            item?: { id?: string };
            error?: string;
          }
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text: typeof data?.error === "string" ? data.error : "提交失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: "修改建议已提交，管理员后台现在可以看到。",
      });
      setDraft("");
      setExpanded(false);
    } catch {
      setNotice({
        type: "error",
        text: "提交失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="surface-card rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-100">建议修改</h2>
          <p className="mt-1 text-sm text-[#aab0a8]">把你发现的问题或补充内容提交给后台审核。</p>
        </div>

        {!isLoggedIn ? (
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]"
          >
            登录后建议修改
          </Link>
        ) : canSuggest ? (
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setExpanded((current) => !current);
            }}
            className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]"
          >
            {expanded ? "收起" : "建议修改"}
          </button>
        ) : null}
      </div>

      {notice ? (
        <div
          className={
            notice.type === "success"
              ? "mt-4 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
              : "mt-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          }
        >
          {notice.text}
        </div>
      ) : null}

      {isLoggedIn && canSuggest && expanded ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={5}
            placeholder="例如：哪一段设定不准确、需要补充什么资料、正文哪里需要修订。"
            className="w-full"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setNotice(null);
              }}
              className="inline-flex items-center rounded-full border border-[rgba(118,137,129,0.18)] bg-[rgba(118,137,129,0.06)] px-3 py-1.5 text-xs font-medium text-[#bfc8be] transition hover:border-[rgba(177,145,87,0.18)] hover:text-white"
            >
              取消
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "提交中..." : "提交建议"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
