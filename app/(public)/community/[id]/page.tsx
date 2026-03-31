import Link from "next/link";
import { notFound } from "next/navigation";

import CommentForm from "@/components/community/comment-form";
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
        orderBy: {
          createdAt: "asc",
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

  return (
    <div className="space-y-8">
      <section className="surface-panel rounded-[28px] px-5 py-6 sm:px-6 sm:py-7">
        <div className="space-y-3">
          <Link
            href="/community"
            className="inline-flex items-center text-sm font-medium text-[#aeb6ac] transition hover:text-zinc-100"
          >
            返回讨论区
          </Link>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-100">
                {post.title}
              </h1>
              <span className="rounded-full accent-chip px-3 py-1 text-xs">
                {parsed.category}
              </span>
              {canDelete ? <DeletePostButton postId={post.id} redirectToList /> : null}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#a5aea3]">
              <span>作者：{authorName(post.user.username, post.user.email)}</span>
              <span>发布时间：{formatDate(post.createdAt)}</span>
              <span>评论：{post._count.comments}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-6">
        <h2 className="text-xl font-semibold text-stone-100">正文</h2>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#d8ded3]">
          {parsed.body || "暂时还没有补充更多正文内容。"}
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-stone-100">发表评论</h2>
          <p className="text-sm text-[#b2b9af]">
            登录后即可使用你的账号参与讨论。
          </p>
        </div>
        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-6">
        <h2 className="text-xl font-semibold text-stone-100">评论列表</h2>
        {post.comments.length === 0 ? (
          <p className="mt-4 text-sm text-[#b2b9af]">还没有评论，欢迎发表第一条看法。</p>
        ) : (
          <div className="mt-4 space-y-4">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[22px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.72)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#a0a89e]">
                  <span>
                    作者：{authorName(comment.user.username, comment.user.email)}
                  </span>
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
