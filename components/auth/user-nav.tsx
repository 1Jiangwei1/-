"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserNav({
  user,
}: {
  user: { username: string } | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/world");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link href="/auth/login" className="shrink-0 rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-2.5 py-1.5 text-[13px] text-[#d9dfdb] transition hover:border-[rgba(177,145,87,0.24)] hover:text-white sm:px-3 sm:py-2 sm:text-sm">
          登录
        </Link>
        <Link href="/auth/register" className="shrink-0 rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-2.5 py-1.5 text-[13px] text-[#e8d4a1] transition hover:bg-[rgba(177,145,87,0.16)] sm:px-3 sm:py-2 sm:text-sm">
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 sm:gap-2">
      <Link href="/notifications" className="shrink-0 rounded-full border border-[rgba(126,165,154,0.18)] px-2.5 py-1.5 text-[13px] text-[#c7cac0] transition hover:border-[rgba(177,145,87,0.28)] hover:text-white sm:px-3 sm:py-2 sm:text-sm">
        通知
      </Link>
      <Link href="/me" className="shrink-0 rounded-full border border-[rgba(126,165,154,0.18)] px-2.5 py-1.5 text-[13px] text-[#c7cac0] transition hover:border-[rgba(177,145,87,0.28)] hover:text-white sm:px-3 sm:py-2 sm:text-sm">
        我的
      </Link>
      <span className="max-w-[5.75rem] truncate rounded-full bg-[rgba(177,145,87,0.08)] px-2.5 py-1.5 text-[13px] text-[#e6d19a] sm:max-w-[12rem] sm:px-3 sm:py-2 sm:text-sm">
        {user.username}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        className="shrink-0 rounded-full border border-[rgba(177,145,87,0.18)] px-2.5 py-1.5 text-[13px] text-[#cfc5ad] transition hover:border-[rgba(177,145,87,0.32)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
      >
        {isSubmitting ? "退出中..." : "退出"}
      </button>
    </div>
  );
}
