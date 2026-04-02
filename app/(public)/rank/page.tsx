import Link from "next/link";

import RankVotePanel from "@/components/rank/rank-vote-panel";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";
import { RANK_BOARD_DEFINITIONS } from "@/lib/rank/boards";

export default async function RankPage() {
  const boards = await prisma.rankBoard.findMany({
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
  });

  const boardMap = new Map(boards.map((board) => [board.title, board]));
  const definition = RANK_BOARD_DEFINITIONS[0];
  const board = boardMap.get(definition.title);
  const items = board?.items ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="surface-panel rounded-[28px] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5">
            <p className="text-xs section-kicker">Ranking Board</p>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-100 sm:text-3xl">
              {"\u6218\u529b\u699c"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#b8bbaf]">
              {"\u5f53\u524d\u53ea\u5c55\u793a\u4eba\u7269\u699c\uff0c\u9996\u5c4f\u76f4\u63a5\u770b\u5230\u699c\u5355\u5185\u5bb9\u548c\u6392\u540d\u5c42\u7ea7\u3002"}
            </p>
          </div>
          <Link
            href="/admin/rank"
            className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.22)] bg-[rgba(177,145,87,0.08)] px-4 py-2 text-sm font-medium text-[#e8d5a3] transition hover:bg-[rgba(177,145,87,0.14)]"
          >
            {"\u6dfb\u52a0\u89d2\u8272"}
          </Link>
        </div>
      </section>

      <section className="surface-card rounded-[26px] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs section-kicker">Current Board</p>
            <h2 className="text-xl font-semibold text-stone-100">
              {definition.title}
            </h2>
          </div>
          <span className="inline-flex rounded-full accent-chip px-2.5 py-1 text-[11px]">
            {items.length > 0
              ? `${items.length} ${"\u4f4d\u4e0a\u699c\u4eba\u7269"}`
              : "\u6682\u65e0\u6570\u636e"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(177,145,87,0.1)] px-5 py-12 text-center text-sm text-[#a6aba3]">
            {"\u4eba\u7269\u699c\u8fd8\u6ca1\u6709\u4e0a\u699c\u5bf9\u8c61\uff0c\u53ef\u4ee5\u76f4\u63a5\u53bb\u6dfb\u52a0\u89d2\u8272\u3002"}
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-[rgba(177,145,87,0.1)] bg-[rgba(8,12,12,0.72)] p-4 transition hover:border-[rgba(177,145,87,0.16)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(177,145,87,0.22)] bg-[rgba(177,145,87,0.07)] text-sm font-semibold text-[#ecd8a6]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
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
                        <p className="pt-0.5 text-xs text-[#8f968d]">
                          {item.votes.length} {"\u6b21\u6295\u7968 \u00b7"} {item._count.comments} {"\u6761\u8bc4\u8bba"}
                        </p>
                      </div>

                      <div className="shrink-0 space-y-3 text-right">
                        <div>
                          <p className="text-xs text-[#8f968d]">{"\u5f53\u524d\u5206\u6570"}</p>
                          <p className="text-xl font-semibold text-[#f1e4bf]">
                            {item.score}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <RankVotePanel
                            itemId={item.id}
                            initialSummary={{
                              supportCount: item.votes.filter((vote) => vote.value === 1).length,
                              opposeCount: item.votes.filter((vote) => vote.value === -1).length,
                            }}
                            compact
                          />
                          <Link
                            href={`/rank/${item.id}`}
                            className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.06)] px-3 py-1.5 text-xs font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.12)]"
                          >
                            {"\u8be6\u60c5"}
                          </Link>
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
