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
                className="rounded-[20px] border border-[rgba(177,145,87,0.1)] bg-[rgba(11,15,15,0.68)] px-3.5 py-3.5 shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:border-[rgba(177,145,87,0.16)] sm:rounded-[22px] sm:p-4"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(177,145,87,0.2)] bg-[rgba(177,145,87,0.06)] text-xs font-semibold text-[#ecd8a6] sm:h-11 sm:w-11 sm:rounded-2xl sm:text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="space-y-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <Link href={`/rank/${item.id}`} className="min-w-0 flex-1">
                            <p className="rank-name truncate text-[15px] font-medium leading-5 text-[#ddcfab] sm:text-[17px] sm:leading-6">
                              {getRankItemDisplayTitle(item)}
                            </p>
                          </Link>
                          <div className="shrink-0 rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.06)] px-2.5 py-1 text-right">
                            <p className="text-[10px] leading-none text-[#8f968d]">分数</p>
                            <p className="mt-1 text-sm font-semibold leading-none text-[#f1e4bf] sm:text-base">
                              {item.score}
                            </p>
                          </div>
                        </div>

                        {item.description ? (
                          <p className="text-[13px] leading-5 text-[#b8bbaf] sm:text-sm sm:leading-6">
                            {item.description}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8f968d] sm:text-xs">
                          <span>{item.votes.length} 次投票</span>
                          <span className="text-[#697067]">·</span>
                          <span>{item._count.comments} 条评论</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_88px] sm:gap-2.5">
                        <div className="min-w-0">
                          <RankVotePanel
                            itemId={item.id}
                            initialSummary={{
                              supportCount: item.votes.filter((vote) => vote.value === 1).length,
                              opposeCount: item.votes.filter((vote) => vote.value === -1).length,
                            }}
                            compact
                          />
                        </div>
                        <Link
                          href={`/rank/${item.id}`}
                          className="inline-flex h-[34px] items-center justify-center rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.06)] px-2.5 text-[11px] font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.12)] sm:h-[36px] sm:px-3 sm:text-xs"
                        >
                          详情
                        </Link>
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
