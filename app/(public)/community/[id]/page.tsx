import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

import CommentComposerInline from "@/components/community/comment-composer-inline";
import CommentLikeButton from "@/components/community/comment-like-button";
import DeletePostButton from "@/components/community/delete-post-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { decodeCommunityPostContent } from "@/lib/community/post-content";
import { prisma } from "@/lib/prisma";

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

function authorName(username: string, email: string) {
  return username || email || "未知用户";
}

export default async function CommunityDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const id = await resolveId(params);
  const currentUser = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const parsed = decodeCommunityPostContent(post.content);
  const canDelete =
    currentUser &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "ADMIN" ||
      currentUser.id === post.user.id);
  const commentIds = post.comments.map((comment) => comment.id);
  let commentLikesEnabled = true;
  let likeCountMap = new Map<string, number>();
  let likedCommentIds = new Set<string>();

  if (commentIds.length > 0) {
    try {
      const likeRows = await prisma.$queryRaw<Array<{ commentId: string; likeCount: bigint }>>(
        Prisma.sql`
          SELECT "commentId", COUNT(*)::bigint AS "likeCount"
          FROM "CommentLike"
          WHERE "commentId" IN (${Prisma.join(commentIds)})
          GROUP BY "commentId"
        `,
      );

      likeCountMap = new Map(
        likeRows.map((row) => [row.commentId, Number(row.likeCount)]),
      );

      if (currentUser) {
        likedCommentIds = new Set(
          (
            await prisma.$queryRaw<Array<{ commentId: string }>>(
              Prisma.sql`
                SELECT "commentId"
                FROM "CommentLike"
                WHERE "userId" = ${currentUser.id}
                  AND "commentId" IN (${Prisma.join(commentIds)})
              `,
            )
          ).map((item) => item.commentId),
        );
      }
    } catch {
      commentLikesEnabled = false;
      likeCountMap = new Map();
      likedCommentIds = new Set();
    }
  }
  const sortedComments = [...post.comments].sort((left, right) => {
    const likeDelta =
      (likeCountMap.get(right.id) ?? 0) - (likeCountMap.get(left.id) ?? 0);
    if (likeDelta !== 0) {
      return likeDelta;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="surface-panel rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-2.5">
          <Link
            href="/community"
            className="inline-flex items-center text-sm font-medium text-[#aeb6ac] transition hover:text-zinc-100"
          >
            返回讨论区
          </Link>
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-start gap-2.5">
              <h1 className="min-w-0 flex-1 text-lg font-semibold leading-tight tracking-tight text-stone-100 sm:text-[1.625rem]">
                {post.title}
              </h1>
              <span className="rounded-full accent-chip px-2.5 py-1 text-[11px]">
                {parsed.category}
              </span>
              {canDelete ? <DeletePostButton postId={post.id} redirectToList /> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a5aea3] sm:text-sm">
              <span>{authorName(post.user.username, post.user.email)}</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>{post._count.comments} 条评论</span>
            </div>
            <div className="border-t border-[rgba(118,137,129,0.12)] pt-3 whitespace-pre-wrap text-sm leading-7 text-[#d8ded3]">
              {parsed.body || "暂时还没有补充更多正文内容。"}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-100">评论</h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#b2b9af] sm:text-sm">{post._count.comments} 条</p>
            <CommentComposerInline
              postId={post.id}
              canComment={Boolean(currentUser)}
              inline
            />
          </div>
        </div>
        {sortedComments.length === 0 ? (
          <p className="text-sm text-[#b2b9af]">还没有评论，欢迎发表第一条看法。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[18px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.72)] p-3.5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a0a89e] sm:text-sm">
                  <span>{authorName(comment.user.username, comment.user.email)}</span>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-7 text-[#d6ddd2]">
                  {comment.content}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-[rgba(118,137,129,0.12)] pt-3">
                  <p className="text-xs text-[#8f978e]">
                    热度 {likeCountMap.get(comment.id) ?? 0}
                  </p>
                  {commentLikesEnabled ? (
                    <CommentLikeButton
                      commentId={comment.id}
                      initialLikeCount={likeCountMap.get(comment.id) ?? 0}
                      initiallyLiked={likedCommentIds.has(comment.id)}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
