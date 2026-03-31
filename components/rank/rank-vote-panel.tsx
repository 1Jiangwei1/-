"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
}: {
  itemId: string;
  initialSummary: VoteSummary;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [notice, setNotice] = useState<Notice>(null);
  const [activeAction, setActiveAction] = useState<VoteAction | null>(null);

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

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={activeAction !== null}
          onClick={() => handleVote("support")}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-4 text-left transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-sm font-medium text-zinc-100">支持当前</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-200">
            {summary.supportCount}
          </p>
        </button>

        <button
          type="button"
          disabled={activeAction !== null}
          onClick={() => handleVote("oppose")}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-4 text-left transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-sm font-medium text-zinc-100">不支持</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-200">
            {summary.opposeCount}
          </p>
        </button>
      </div>
    </div>
  );
}
