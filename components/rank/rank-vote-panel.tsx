"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type VoteSummary = {
  supportCount: number;
  opposeCount: number;
};

type VoteAction = "support" | "oppose";

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function RankVotePanel({
  itemId,
  initialSummary,
  compact = false,
}: {
  itemId: string;
  initialSummary: VoteSummary;
  compact?: boolean;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [notice, setNotice] = useState<Notice>(null);
  const [activeAction, setActiveAction] = useState<VoteAction | null>(null);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => {
    if (restoreScrollRef.current === null) {
      return;
    }

    const targetY = restoreScrollRef.current;
    let frame = 0;

    const restore = () => {
      window.scrollTo({ top: targetY, behavior: "auto" });
      frame += 1;

      if (frame < 6) {
        requestAnimationFrame(restore);
        return;
      }

      restoreScrollRef.current = null;
    };

    requestAnimationFrame(restore);
  });

  async function handleVote(action: VoteAction) {
    setNotice(null);
    setActiveAction(action);

    try {
      const response = await fetch(`/api/rank/items/${itemId}/vote`, {
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
            supportCount?: number;
            opposeCount?: number;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "投票失败，请稍后重试。",
        });
        return;
      }

      setSummary({
        supportCount: data?.supportCount ?? summary.supportCount,
        opposeCount: data?.opposeCount ?? summary.opposeCount,
      });
      setNotice({
        type: "success",
        text: data?.message ?? "投票成功",
      });
      restoreScrollRef.current = window.scrollY;
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "投票失败，请检查网络后重试。",
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      {notice ? (
        <div
          className={
            notice.type === "success"
              ? compact
                ? "rounded-xl border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300"
                : "rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
              : compact
                ? "rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300"
                : "rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-3 md:grid-cols-2"}>
        <button
          type="button"
          disabled={activeAction !== null}
          onClick={() => handleVote("support")}
          className={
            compact
              ? "inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[rgba(118,137,129,0.16)] bg-[rgba(11,15,15,0.56)] px-2.5 py-1.5 text-center transition hover:border-[rgba(177,145,87,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              : "rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-4 text-left transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          <p className={compact ? "truncate text-[11px] font-medium text-zinc-100" : "text-sm font-medium text-zinc-100"}>支持</p>
          <p className={compact ? "text-[13px] font-semibold text-[#ecd8a6]" : "mt-2 text-2xl font-semibold text-zinc-200"}>
            {summary.supportCount}
          </p>
        </button>

        <button
          type="button"
          disabled={activeAction !== null}
          onClick={() => handleVote("oppose")}
          className={
            compact
              ? "inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[rgba(118,137,129,0.16)] bg-[rgba(11,15,15,0.56)] px-2.5 py-1.5 text-center transition hover:border-[rgba(177,145,87,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              : "rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-4 text-left transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          <p className={compact ? "truncate text-[11px] font-medium text-zinc-100" : "text-sm font-medium text-zinc-100"}>不支持</p>
          <p className={compact ? "text-[13px] font-semibold text-zinc-200" : "mt-2 text-2xl font-semibold text-zinc-200"}>
            {summary.opposeCount}
          </p>
        </button>
      </div>
    </div>
  );
}
