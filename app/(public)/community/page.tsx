import Link from "next/link";

import DeletePostButton from "@/components/community/delete-post-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { decodeCommunityPostContent } from "@/lib/community/post-content";
import { prisma } from "@/lib/prisma";

type RawSearchParams = Promise<{
  q?: string | string[];
}>;

function pickFirst(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function resolveSearchParams(searchParams?: RawSearchParams) {
  const resolved = await searchParams;

  return {
    q: pickFirst(resolved?.q).trim(),
  };
}

function authorName(username: string, email: string) {
  return username || email || "未知用户";
}

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function fallbackSummary(category: string, title: string) {
  if (category.includes("剧情")) {
    return `这篇关于《${title}》的剧情讨论已经发起，进入帖子可继续查看完整观点。`;
  }

  if (category.includes("设定")) {
    return `这篇帖子正在围绕《${title}》补充设定和考据，详情页里可以继续展开阅读。`;
  }

  if (category.includes("求助")) {
    return `这篇帖子正在征集大家对《${title}》的看法与建议，进入详情页可继续参与。`;
  }

  return `围绕《${title}》的讨论已经开启，进入帖子可继续查看完整内容。`;
}

export default async function CommunityPage({ searchParams }: { searchParams?: RawSearchParams }) {
  const { q } = await resolveSearchParams(searchParams);
  const currentUser = await getCurrentUser();

  const posts = await prisma.post.findMany({
    include: {
      user: { select: { id: true, username: true, email: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedPosts = posts
    .map((post) => {
      const parsed = decodeCommunityPostContent(post.content);

      return {
        id: post.id,
        title: post.title,
        category: parsed.category,
        summary: parsed.body,
        authorId: post.user.id,
        createdAt: post.createdAt,
        createdAtLabel: formatPostDate(post.createdAt),
        author: authorName(post.user.username, post.user.email),
        commentCount: post._count.comments,
      };
    })
    .filter((post) => {
      if (!q) {
        return true;
      }

      const keyword = q.toLowerCase();
      return [post.title, post.category, post.summary, post.author]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword));
    })
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="surface-card rounded-[22px] p-4 sm:p-4.5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <label htmlFor="community-search" className="sr-only">搜索帖子</label>
            <input
              id="community-search"
              name="q"
              defaultValue={q}
              placeholder="搜索标题、正文、作者"
              className="w-full"
            />
          </div>
          <div className="flex gap-3 sm:shrink-0">
            <button type="submit" className="inline-flex items-center justify-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2.5 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]">搜索</button>
            <Link href="/community/new" className="inline-flex items-center justify-center rounded-full bg-[rgba(177,145,87,0.92)] px-4 py-2.5 text-sm font-medium text-[#171208] transition hover:bg-[#dbc189]">发布新帖</Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-100">帖子列表</h2>
          <p className="text-sm text-[#a7afa6]">共 {normalizedPosts.length} 篇帖子</p>
        </div>

        {normalizedPosts.length === 0 ? (
          <div className="surface-card rounded-[22px] px-6 py-14 text-center text-sm text-[#adb4aa]">{q ? "没有找到匹配的帖子，换个关键词试试。" : "当前还没有帖子，直接发布第一篇讨论吧。"}</div>
        ) : (
          <div className="columns-2 gap-3 sm:gap-4 xl:gap-5">
            {normalizedPosts.map((post) => (
              <article key={post.id} className="mb-3 break-inside-avoid sm:mb-4 xl:mb-5">
                <div className="surface-card rounded-[18px] border border-[rgba(118,137,129,0.12)] bg-[rgba(22,29,28,0.86)] p-3 sm:rounded-[20px] sm:p-4 transition hover:border-[rgba(177,145,87,0.16)] hover:bg-[rgba(27,33,32,0.98)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.07)] px-2.5 py-1 text-[11px] text-[#dbc189]">
                      {post.category}
                    </span>
                    {currentUser &&
                    (currentUser.role === "OWNER" ||
                      currentUser.role === "ADMIN" ||
                      currentUser.id === post.authorId) ? (
                      <div className="shrink-0">
                        <DeletePostButton postId={post.id} />
                      </div>
                    ) : null}
                  </div>

                  <Link href={`/community/${post.id}`} className="mt-3 block space-y-3">
                    <h3 className="text-[15px] font-semibold leading-6 text-stone-100 transition hover:text-[#e2cca0] sm:text-[17px] sm:leading-7">
                      {post.title}
                    </h3>
                    <p className="text-[13px] leading-6 text-[#c0c6bc] sm:text-sm sm:leading-7">
                      {post.summary || fallbackSummary(post.category, post.title)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[rgba(118,137,129,0.12)] pt-3 text-xs text-[#97a096] sm:text-sm">
                      <span>{post.author}</span>
                      <span>{post.createdAtLabel}</span>
                      <span>{post.commentCount} 条评论</span>
                    </div>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
