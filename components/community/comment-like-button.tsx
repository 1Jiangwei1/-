"use client";

import { useState } from "react";

type Notice =
  | { type: "error"; text: string }
  | null;

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function CommentLikeButton({
  commentId,
  initialLikeCount,
  initiallyLiked,
}: {
  commentId: string;
  initialLikeCount: number;
  initiallyLiked: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function handleLike() {
    if (isSubmitting) {
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: "POST",
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
            liked?: boolean;
            likeCount?: number;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "评论点赞失败，请稍后重试。",
        });
        return;
      }

      setLiked(Boolean(data?.liked));
      setLikeCount(data?.likeCount ?? likeCount);
    } catch {
      setNotice({
        type: "error",
        text: "评论点赞失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleLike}
        disabled={isSubmitting}
        className={
          liked
            ? "inline-flex items-center rounded-full border border-[rgba(177,145,87,0.28)] bg-[rgba(177,145,87,0.12)] px-3 py-1 text-xs font-medium text-[#ecd8a6] transition disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex items-center rounded-full border border-[rgba(118,137,129,0.18)] bg-[rgba(118,137,129,0.06)] px-3 py-1 text-xs font-medium text-[#bfc8be] transition hover:border-[rgba(177,145,87,0.18)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {liked ? `已赞 ${likeCount}` : `点赞 ${likeCount}`}
      </button>
      {notice ? <p className="text-xs text-red-300">{notice.text}</p> : null}
    </div>
  );
}
