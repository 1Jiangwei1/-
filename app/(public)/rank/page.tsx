import Link from "next/link";
import { UserRole } from "@prisma/client";

import RankVotePanel from "@/components/rank/rank-vote-panel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";
import { RANK_BOARD_DEFINITIONS } from "@/lib/rank/boards";

export default async function RankPage() {
  const [currentUser, boards] = await Promise.all([
    getCurrentUser(),
    prisma.rankBoard.findMany({
      where: {
        title: {
          in: RANK_BOARD_DEFINITIONS.map((item) => item.title),
        },
      },
      include: {
        items: {
          include: {
            loreEntry: { select: { title: true } },
            votes: { select: { value: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { score: "desc" },
        },
      },
    }),
  ]);

  const canManageRank =
    currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN;

  const boardMap = new Map(boards.map((board) => [board.title, board]));
  const definition = RANK_BOARD_DEFINITIONS[0];
  const board = boardMap.get(definition.title);
  const items = board?.items ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="surface-panel rounded-[24px] px-4 py-4 sm:px-5 sm:py-4.5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] section-kicker">Ranking Board</p>
            <h1 className="text-xl font-semibold tracking-tight text-stone-100 sm:text-2xl">
              战力榜
            </h1>
          </div>
          {canManageRank ? (
            <Link
              href="/admin/rank"
              className="inline-flex shrink-0 items-center rounded-full border border-[rgba(177,145,87,0.22)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#e8d5a3] transition hover:bg-[rgba(177,145,87,0.14)]"
            >
              添加角色
            </Link>
          ) : null}
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs section-kicker">Current Board</p>
            <h2 className="text-xl font-semibold text-stone-100">
              {definition.title}
            </h2>
          </div>
          <span className="inline-flex rounded-full accent-chip px-2.5 py-1 text-[11px]">
            {items.length > 0 ? `${items.length} 位上榜人物` : "暂无数据"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(177,145,87,0.1)] px-5 py-12 text-center text-sm text-[#a6aba3]">
            人物榜还没有上榜对象，可以直接去添加角色。
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-[rgba(177,145,87,0.1)] bg-[rgba(8,12,12,0.72)] p-4 transition hover:border-[rgba(177,145,87,0.16)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(177,145,87,0.22)] bg-[rgba(177,145,87,0.07)] text-sm font-semibold text-[#ecd8a6]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <Link href={`/rank/${item.id}`} className="block">
                          <p className="rank-name truncate text-[17px] font-medium text-[#d8cda8]">
                            {getRankItemDisplayTitle(item)}
                          </p>
                        </Link>
                        {item.description ? (
                          <p className="line-clamp-1 pt-0.5 text-sm text-[#b8bbaf]">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-x-2 gap-y-1 pt-0.5 text-xs text-[#8f968d]">
                          <span>{item.votes.length} 次投票</span>
                          <span className="hidden text-[#697067] sm:inline">·</span>
                          <span>{item._count.comments} 条评论</span>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-3 sm:shrink-0 sm:text-right">
                        <div>
                          <p className="text-xs text-[#8f968d]">当前分数</p>
                          <p className="text-xl font-semibold text-[#f1e4bf]">
                            {item.score}
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          <RankVotePanel
                            itemId={item.id}
                            initialSummary={{
                              supportCount: item.votes.filter((vote) => vote.value === 1).length,
                              opposeCount: item.votes.filter((vote) => vote.value === -1).length,
                            }}
                            compact
                          />
                          <div className="flex sm:justify-end">
                            <Link
                              href={`/rank/${item.id}`}
                              className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.06)] px-3 py-1.5 text-xs font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.12)]"
                            >
                              详情
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
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
