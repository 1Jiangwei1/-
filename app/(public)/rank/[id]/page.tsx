import Link from "next/link";
import { notFound } from "next/navigation";

import RankCommentForm from "@/components/rank/rank-comment-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreCategoryLabel } from "@/lib/lore/category-label";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";

type PageParams = Promise<{
  id: string;
}>;

async function resolveId(params: PageParams) {
  const resolved = await params;
  return resolved.id;
}

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

function authorName(
  userId: string,
  userMap: Map<string, { username: string; email: string }>
) {
  const user = userMap.get(userId);
  return user?.username || user?.email || "未知用户";
}

export default async function RankDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const id = await resolveId(params);
  const currentUser = await getCurrentUser();

  const item = await prisma.rankItem.findUnique({
    where: { id },
    include: {
      board: true,
      loreEntry: {
        select: {
          title: true,
          slug: true,
          category: true,
        },
      },
      comments: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const siblingItems = await prisma.rankItem.findMany({
    where: {
      boardId: item.boardId,
    },
    select: {
      id: true,
      score: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  const ranking =
    siblingItems.findIndex((sibling) => sibling.id === item.id) + 1 || 1;

  const commentUserIds = Array.from(
    new Set(item.comments.map((comment) => comment.userId))
  );
  const users =
    commentUserIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: commentUserIds,
            },
          },
          select: {
            id: true,
            username: true,
            email: true,
          },
        })
      : [];

  const userMap = new Map(
    users.map((user) => [
      user.id,
      {
        username: user.username,
        email: user.email,
      },
    ])
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="surface-panel rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-2.5">
          <Link
            href="/rank"
            className="inline-flex items-center text-sm font-medium text-[#aeb6ac] transition hover:text-zinc-100"
          >
            返回战力榜
          </Link>
          <div className="flex flex-wrap items-start gap-2.5">
            <h1 className="min-w-0 flex-1 text-2xl font-semibold leading-tight tracking-tight text-stone-100 sm:text-[1.875rem]">
              {getRankItemDisplayTitle(item)}
            </h1>
            <span className="rounded-full accent-chip px-2.5 py-1 text-[11px]">
              {item.board.title}
            </span>
            {item.loreEntry?.category ? (
              <span className="rounded-full soft-chip px-2.5 py-1 text-[11px]">
                {getLoreCategoryLabel(item.loreEntry.category)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a5aea3] sm:text-sm">
            <span>当前排名：{ranking}</span>
            <span>当前分数：{item.score}</span>
            <span>评论：{item.comments.length}</span>
            {item.loreEntry?.slug ? (
              <Link
                href={`/world/${item.loreEntry.slug}`}
                className="text-[#d3d8cf] transition hover:text-white"
              >
                查看词条详情
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-100">评论</h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#b2b9af] sm:text-sm">{item.comments.length} 条</p>
            <RankCommentForm itemId={item.id} canComment={Boolean(currentUser)} inline />
          </div>
        </div>
        {item.comments.length === 0 ? (
          <p className="text-sm text-[#b2b9af]">
            还没有评论，欢迎留下第一条看法。
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {item.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[18px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.72)] p-3.5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a0a89e] sm:text-sm">
                  <span>作者：{authorName(comment.userId, userMap)}</span>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-7 text-[#d6ddd2]">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
