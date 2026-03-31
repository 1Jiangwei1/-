"use client";

import { useRouter } from "next/navigation";
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

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
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
          text: data?.message ?? "评论失败，请稍后重试。",
        });
        return;
      }

      setContent("");
      setNotice({
        type: "success",
        text: data?.message ?? "评论成功",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "评论失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-2">
        <label
          htmlFor="comment-content"
          className="text-sm font-medium text-zinc-200"
        >
          发表评论
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-[120px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          placeholder="写下你的看法"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : "发布评论"}
        </button>
      </div>
    </form>
  );
}
