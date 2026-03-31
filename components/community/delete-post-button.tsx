"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function DeletePostButton({
  postId,
  redirectToList = false,
}: {
  postId: string;
  redirectToList?: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = window.confirm("\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u7bc7\u5e16\u5b50\u5417\uff1f\u5220\u9664\u540e\u5c06\u65e0\u6cd5\u6062\u590d\u3002");
    if (!confirmed) {
      return;
    }

    setNotice(null);

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        setNotice(data?.error ?? data?.message ?? "\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
        return;
      }

      window.alert(data?.message ?? "\u5220\u9664\u6210\u529f");

      startTransition(() => {
        if (redirectToList) {
          router.push("/community");
        } else {
          router.refresh();
        }
      });
    } catch {
      setNotice("\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5\u3002");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/8 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "\u5220\u9664\u4e2d..." : "\u5220\u9664\u5e16\u5b50"}
      </button>
      {notice ? <p className="text-xs text-red-300">{notice}</p> : null}
    </div>
  );
}