import Link from "next/link";

import type { Route } from "next";

import { decodeCommunityPostContent } from "@/lib/community/post-content";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function FavoritePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">我的收藏</h1>
          <p className="mt-3 text-sm text-zinc-400">请先登录后查看你的收藏内容。</p>
        </div>
      </main>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: currentUser.id },
    include: {
      loreEntry: true,
      post: true,
      rankItem: {
        include: {
          board: true,
          loreEntry: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-100">我的收藏</h1>
            <p className="mt-2 text-sm text-zinc-400">按词条、帖子、排行对象汇总你的收藏内容。</p>
          </div>
          <Link href="/me" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900">返回我的页面</Link>
        </div>
      </section>

      <section className="space-y-4">
        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 px-6 py-10 text-center text-sm text-zinc-400">你还没有收藏任何内容。</div>
        ) : (
          favorites.map((favorite) => {
            const type = favorite.loreEntry ? "词条" : favorite.post ? "帖子" : "排行";
            const href: Route = favorite.loreEntry ? `/world/${favorite.loreEntry.slug}` as Route : favorite.post ? `/community/${favorite.post.id}` as Route : favorite.rankItem ? `/rank/${favorite.rankItem.id}` as Route : "/me";
            const title = favorite.loreEntry?.title ?? favorite.post?.title ?? favorite.rankItem?.loreEntry?.title ?? "未命名内容";
            const description = favorite.loreEntry ? favorite.loreEntry.summary || "暂无摘要" : favorite.post ? decodeCommunityPostContent(favorite.post.content).body || "暂无正文" : favorite.rankItem?.board.title || "暂无说明";

            return (
              <Link key={favorite.id} href={href} className="block rounded-3xl border border-zinc-800 bg-zinc-950/70 px-5 py-5 transition hover:border-zinc-600 hover:bg-zinc-900/70">
                <p className="text-xs text-zinc-500">{type}</p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">{title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{description}</p>
                <p className="mt-3 text-xs text-zinc-500">收藏时间：{formatDate(favorite.createdAt)}</p>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
