import Link from "next/link";
import { notFound } from "next/navigation";

import RankCommentForm from "@/components/rank/rank-comment-form";
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
    <div className="space-y-8">
      <section className="surface-panel rounded-[28px] px-5 py-6 sm:px-6 sm:py-7">
        <div className="space-y-3">
          <Link
            href="/rank"
            className="inline-flex items-center text-sm font-medium text-[#aeb6ac] transition hover:text-zinc-100"
          >
            返回战力榜
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-100">
              {getRankItemDisplayTitle(item)}
            </h1>
            <span className="rounded-full accent-chip px-3 py-1 text-xs">
              {item.board.title}
            </span>
            {item.loreEntry?.category ? (
              <span className="rounded-full soft-chip px-3 py-1 text-xs">
                {getLoreCategoryLabel(item.loreEntry.category)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#a5aea3]">
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

      <section className="surface-card rounded-[26px] p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-stone-100">发表评论</h2>
          <p className="text-sm text-[#b2b9af]">
            登录后即可使用你的账号发表评论，不需要额外权限。
          </p>
        </div>
        <div className="mt-4">
          <RankCommentForm itemId={item.id} />
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-6">
        <h2 className="text-xl font-semibold text-stone-100">评论列表</h2>
        {item.comments.length === 0 ? (
          <p className="mt-4 text-sm text-[#b2b9af]">
            还没有评论，欢迎留下第一条看法。
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {item.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[22px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.72)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#a0a89e]">
                  <span>作者：{authorName(comment.userId, userMap)}</span>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d6ddd2]">
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
