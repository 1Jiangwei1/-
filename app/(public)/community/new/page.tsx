import Link from "next/link";

import PostEditorForm from "@/components/community/post-editor-form";

export default function CommunityNewPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/community"
          className="inline-flex items-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
        >
          返回讨论区
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            发布新帖
          </h1>
          <p className="text-sm leading-6 text-zinc-400">
            登录后会使用当前账号作为发帖作者。
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
        <PostEditorForm />
      </section>
    </div>
  );
}
