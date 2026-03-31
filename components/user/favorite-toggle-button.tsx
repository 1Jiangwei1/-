"use client";

import { useState } from "react";

type FavoriteType = "lore" | "post" | "rank";

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

export default function FavoriteToggleButton({
  type,
  targetId,
  initialFavorited,
  compact = false,
}: {
  type: FavoriteType;
  targetId: string;
  initialFavorited: boolean;
  compact?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          targetId,
        }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            favorited?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "收藏操作失败，请稍后重试。",
        });
        return;
      }

      setFavorited(Boolean(data?.favorited));
      setNotice({
        type: "success",
        text: data?.message ?? (data?.favorited ? "已收藏" : "已取消收藏"),
      });
    } catch {
      setNotice({
        type: "error",
        text: "收藏操作失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1.5 text-right">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleClick}
        className={
          compact
            ? favorited
              ? "inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-2.5 py-1 text-[11px] font-medium text-[#e8d7ae] transition hover:border-[rgba(177,145,87,0.4)] hover:bg-[rgba(177,145,87,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
              : "inline-flex items-center rounded-full border border-[rgba(126,165,154,0.16)] bg-[rgba(126,165,154,0.06)] px-2.5 py-1 text-[11px] font-medium text-[#c8d2ce] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            : favorited
              ? "inline-flex items-center rounded-full border border-[rgba(177,145,87,0.32)] bg-[rgba(177,145,87,0.12)] px-4 py-2.5 text-sm font-medium text-[#ecd8a6] transition hover:border-[rgba(177,145,87,0.46)] hover:bg-[rgba(177,145,87,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              : "inline-flex items-center rounded-full border border-[rgba(126,165,154,0.2)] bg-[rgba(126,165,154,0.08)] px-4 py-2.5 text-sm font-medium text-[#d1dbd7] transition hover:border-[rgba(177,145,87,0.28)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isSubmitting ? "处理中..." : favorited ? "已收藏" : "收藏"}
      </button>
      {notice ? (
        <p
          className={
            compact
              ? notice.type === "success"
                ? "text-xs text-[#a8c1ba]"
                : "text-xs text-red-300"
              : notice.type === "success"
                ? "text-sm text-[#a8c1ba]"
                : "text-sm text-red-300"
          }
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
