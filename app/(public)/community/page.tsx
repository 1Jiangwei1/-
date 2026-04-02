import Link from "next/link";

import DeletePostButton from "@/components/community/delete-post-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { COMMUNITY_CATEGORIES, decodeCommunityPostContent } from "@/lib/community/post-content";
import { prisma } from "@/lib/prisma";

type RawSearchParams = Promise<{
  category?: string | string[];
  sort?: string | string[];
}>;

function pickFirst(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function resolveSearchParams(searchParams?: RawSearchParams) {
  const resolved = await searchParams;

  return {
    category: pickFirst(resolved?.category).trim(),
    sort: pickFirst(resolved?.sort).trim() || "latest",
  };
}

function authorName(username: string, email: string) {
  return username || email || "未知用户";
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
  const { category, sort } = await resolveSearchParams(searchParams);
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
        author: authorName(post.user.username, post.user.email),
        commentCount: post._count.comments,
      };
    })
    .filter((post) => (category ? post.category === category : true))
    .sort((left, right) => {
      if (sort === "hot" && right.commentCount !== left.commentCount) {
        return right.commentCount - left.commentCount;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="surface-panel rounded-[24px] px-5 py-5 sm:px-6 sm:py-5.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2.5">
            <p className="text-xs section-kicker">Community Threads</p>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-100 sm:text-3xl">讨论区</h1>
            <p className="max-w-2xl text-sm leading-6 text-[#c0c7bc]">按分类和热度快速扫读帖子，首屏尽快露出讨论内容。</p>
          </div>

          <Link href="/community/new" className="inline-flex items-center rounded-full bg-[rgba(177,145,87,0.92)] px-4 py-2.5 text-sm font-medium text-[#171208] transition hover:bg-[#dbc189]">发布新帖</Link>
        </div>
      </section>

      <section className="surface-card rounded-[22px] p-4 sm:p-4.5">
        <form className="grid gap-4 md:grid-cols-[220px,220px,auto]">
          <div className="space-y-2">
            <label htmlFor="community-category" className="text-sm font-medium text-[#dfded2]">分类筛选</label>
            <select id="community-category" name="category" defaultValue={category} className="w-full">
              <option value="">全部分类</option>
              {COMMUNITY_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="community-sort" className="text-sm font-medium text-[#dfded2]">排序方式</label>
            <select id="community-sort" name="sort" defaultValue={sort} className="w-full">
              <option value="latest">最新</option>
              <option value="hot">热门</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button type="submit" className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.24)] bg-[rgba(177,145,87,0.08)] px-4 py-2.5 text-sm font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.14)]">应用筛选</button>
            <Link href="/community" className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-4 py-2.5 text-sm font-medium text-[#d3dbd7] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white">清空</Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-100">帖子列表</h2>
          <p className="text-sm text-[#a7afa6]">共 {normalizedPosts.length} 篇帖子</p>
        </div>

        {normalizedPosts.length === 0 ? (
          <div className="surface-card rounded-[22px] px-6 py-14 text-center text-sm text-[#adb4aa]">当前筛选条件下还没有帖子，试试切换分类或直接发布第一篇讨论。</div>
        ) : (
          <div className="space-y-3.5">
            {normalizedPosts.map((post) => (
              <div key={post.id} className="surface-card rounded-[22px] p-4 transition hover:border-[rgba(177,145,87,0.16)] hover:bg-[rgba(27,33,32,0.98)]">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/community/${post.id}`} className="min-w-0 flex-1">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.07)] px-2.5 py-1 text-[11px] text-[#dbc189]">{post.category}</span>
                        <h3 className="text-lg font-semibold text-stone-100">{post.title}</h3>
                      </div>
                      <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#c0c6bc]">
                        {post.summary || fallbackSummary(post.category, post.title)}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#a0a89e]">
                        <span>作者：{post.author}</span>
                        <span>{post.commentCount} 条评论</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    {currentUser &&
                    (currentUser.role === "OWNER" ||
                      currentUser.role === "ADMIN" ||
                      currentUser.id === post.authorId) ? (
                      <DeletePostButton postId={post.id} />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
