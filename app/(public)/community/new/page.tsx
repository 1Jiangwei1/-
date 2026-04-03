import Link from "next/link";

import PostEditorForm from "@/components/community/post-editor-form";

export default function CommunityNewPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/community"
        className="inline-flex items-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
      >
        返回讨论区
      </Link>

      <section className="rounded-[24px] border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
        <PostEditorForm />
      </section>
    </div>
  );
}
