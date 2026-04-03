import Link from "next/link";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

import { getRankItemDisplayTitle } from "@/lib/rank/item-title";

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

export default async function MePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">我的</h1>
          <p className="mt-3 text-sm text-zinc-400">请先登录后查看你的帖子、评论和投票。</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/auth/login" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900">去登录</Link>
            <Link href="/auth/register" className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200">去注册</Link>
          </div>
        </div>
      </main>
    );
  }

  const [posts, comments, votes] = await Promise.all([
    prisma.post.findMany({ where: { userId: currentUser.id }, include: { comments: true }, orderBy: { createdAt: "desc" } }),
    prisma.comment.findMany({ where: { userId: currentUser.id }, include: { post: true }, orderBy: { createdAt: "desc" } }),
    prisma.rankVote.findMany({ where: { userId: currentUser.id }, include: { rankItem: { include: { board: true, loreEntry: true } } } }),
  ]);
  const canAccessAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OWNER;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-100">我的</h1>
            <p className="mt-2 text-sm text-zinc-400">查看你最近发布的内容和互动记录。</p>
          </div>
          <div className="flex gap-3">
            <Link href="/notifications" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900">查看通知</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"><p className="text-sm text-zinc-400">我的帖子</p><p className="mt-3 text-3xl font-semibold text-zinc-100">{posts.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"><p className="text-sm text-zinc-400">我的评论</p><p className="mt-3 text-3xl font-semibold text-zinc-100">{comments.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"><p className="text-sm text-zinc-400">我的投票</p><p className="mt-3 text-3xl font-semibold text-zinc-100">{votes.length}</p></div>
      </section>

      {canAccessAdmin ? (
        <section className="rounded-3xl border border-[rgba(177,145,87,0.18)] bg-[rgba(20,25,24,0.78)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">后台入口</h2>
              <p className="mt-2 text-sm text-zinc-400">从这里进入内容审核、战力榜维护和首页快报权限管理。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/lore" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900">
                词条后台
              </Link>
              <Link href="/admin/rank" className="rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm text-[#e8d4a1] transition hover:bg-[rgba(177,145,87,0.16)]">
                战力榜后台
              </Link>
              {currentUser.role === UserRole.OWNER ? (
                <Link href="/admin/briefing" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900">
                  快报权限
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-zinc-100">我的帖子</h2><Link href="/community/new" className="text-sm text-zinc-400 transition hover:text-zinc-100">发布新帖</Link></div>
          <div className="mt-4 space-y-3">{posts.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-400">你还没有发布帖子。</p> : posts.map((post) => <Link key={post.id} href={`/community/${post.id}`} className="block rounded-2xl border border-zinc-800 px-4 py-4 transition hover:border-zinc-600 hover:bg-zinc-900/60"><p className="text-sm font-medium text-zinc-100">{post.title}</p><p className="mt-2 text-xs text-zinc-500">{formatDate(post.createdAt)} · {post.comments.length} 条评论</p></Link>)}</div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">我的评论</h2>
          <div className="mt-4 space-y-3">{comments.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-400">你还没有发表评论。</p> : comments.map((comment) => <Link key={comment.id} href={comment.postId ? `/community/${comment.postId}` : "/community"} className="block rounded-2xl border border-zinc-800 px-4 py-4 transition hover:border-zinc-600 hover:bg-zinc-900/60"><p className="text-sm text-zinc-300">《{comment.post?.title ?? "已删除帖子"}》</p><p className="mt-2 line-clamp-2 text-sm text-zinc-100">{comment.content}</p><p className="mt-2 text-xs text-zinc-500">{formatDate(comment.createdAt)}</p></Link>)}</div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">我的投票</h2>
          <div className="mt-4 space-y-3">{votes.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-400">你还没有参与战力榜投票。</p> : votes.map((vote) => <Link key={vote.id} href={`/rank/${vote.rankItemId}`} className="block rounded-2xl border border-zinc-800 px-4 py-4 transition hover:border-zinc-600 hover:bg-zinc-900/60"><p className="text-sm font-medium text-zinc-100">{getRankItemDisplayTitle(vote.rankItem)}</p><p className="mt-2 text-sm text-zinc-400">{vote.rankItem.board.title} · 当前分数 {vote.rankItem.score}</p><p className="mt-2 text-xs text-zinc-500">你的投票倾向：{vote.value > 0 ? "支持当前" : vote.value === 0 ? "保持不变" : "应更低"}</p></Link>)}</div>
        </div>

      </section>
    </main>
  );
}
