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
      <div className="flex items-center gap-2">
        <Link href="/auth/login" className="rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-3 py-2 text-sm text-[#d9dfdb] transition hover:border-[rgba(177,145,87,0.24)] hover:text-white">
          登录
        </Link>
        <Link href="/auth/register" className="rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-3 py-2 text-sm text-[#e8d4a1] transition hover:bg-[rgba(177,145,87,0.16)]">
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <Link href="/notifications" className="rounded-full border border-[rgba(126,165,154,0.18)] px-3 py-2 text-sm text-[#c7cac0] transition hover:border-[rgba(177,145,87,0.28)] hover:text-white">
        通知
      </Link>
      <Link href="/me" className="rounded-full border border-[rgba(126,165,154,0.18)] px-3 py-2 text-sm text-[#c7cac0] transition hover:border-[rgba(177,145,87,0.28)] hover:text-white">
        我的
      </Link>
      <span className="rounded-full bg-[rgba(177,145,87,0.08)] px-3 py-2 text-sm text-[#e6d19a]">
        {user.username}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        className="rounded-full border border-[rgba(177,145,87,0.18)] px-3 py-2 text-sm text-[#cfc5ad] transition hover:border-[rgba(177,145,87,0.32)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "退出中..." : "退出"}
      </button>
    </div>
  );
}
