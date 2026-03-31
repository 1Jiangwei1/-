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

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
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
          text: data?.message ?? "登录失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "登录成功",
      });
      window.setTimeout(() => {
        router.push("/world");
        router.refresh();
      }, 500);
    } catch {
      setNotice({
        type: "error",
        text: "登录失败，请检查网络后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
      <Link
        href="/world"
        className="inline-flex items-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
      >
        返回首页
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-100">登录</h1>
        <p className="text-sm text-zinc-400">
          使用用户名或邮箱登录，登录后即可正常发帖、评论、投票与提交建议。
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="用户名或邮箱"
          required
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="密码"
          required
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
        />
        <button
          disabled={isSubmitting}
          className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        还没有账号？{" "}
        <Link href="/auth/register" className="text-zinc-100 transition hover:text-white">
          去注册
        </Link>
      </p>
    </section>
  );
}
