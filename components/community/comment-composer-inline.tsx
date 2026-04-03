"use client";

import Link from "next/link";
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

export default function CommentComposerInline({
  postId,
  canComment,
  inline = false,
}: {
  postId: string;
  canComment: boolean;
  inline?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/create`, {
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
      setOpen(false);
      setNotice({
        type: "success",
        text: data?.message ?? "评论成功。",
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

  if (!canComment) {
    const loginButton = (
      <Link
        href="/auth/login"
        className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]"
      >
        登录后发表评论
      </Link>
    );

    return inline ? loginButton : <div className="flex justify-end">{loginButton}</div>;
  }

  if (inline) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]"
        >
          {open ? "收起评论" : "发表评论"}
        </button>

        {open ? (
          <div className="absolute right-0 top-full z-20 mt-3 w-[min(28rem,calc(100vw-3rem))] rounded-[18px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.98)] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
            {notice ? (
              <div
                className={
                  notice.type === "success"
                    ? "mb-3 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
                    : "mb-3 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                }
              >
                {notice.text}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[84px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition focus:border-zinc-600"
                placeholder="写下你的看法"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "提交中..." : "发表评论"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {!open ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]"
          >
            发表评论
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[84px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition focus:border-zinc-600"
            placeholder="写下你的看法"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-full border border-[rgba(118,137,129,0.18)] bg-[rgba(118,137,129,0.06)] px-3 py-1.5 text-xs font-medium text-[#bfc8be] transition hover:border-[rgba(177,145,87,0.18)] hover:text-white"
            >
              收起
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "提交中..." : "发表评论"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
