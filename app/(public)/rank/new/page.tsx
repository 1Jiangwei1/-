import Link from "next/link";
import { redirect } from "next/navigation";

import RankBoardManager from "@/components/admin/rank-board-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";
import { RANK_BOARD_DEFINITIONS } from "@/lib/rank/boards";

export default async function PublicRankCreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const boardTitleSet = new Set(RANK_BOARD_DEFINITIONS.map((item) => item.title));

  const existingBoards = await prisma.rankBoard.findMany({
    where: {
      title: {
        in: Array.from(boardTitleSet),
      },
    },
    include: {
      items: {
        include: {
          loreEntry: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
        orderBy: {
          score: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const boardMap = new Map(existingBoards.map((board) => [board.title, board]));
  const boards = RANK_BOARD_DEFINITIONS.flatMap((definition) => {
    const board = boardMap.get(definition.title);
    return board ? [board] : [];
  });

  const boardPayload = boards.map((board) => ({
    id: board.id,
    title: board.title,
    items: board.items.map((item) => ({
      id: item.id,
      score: item.score,
      title: getRankItemDisplayTitle(item),
      description: item.description,
      customTitle: item.title,
      category: item.loreEntry?.category ?? null,
      loreEntryTitle: item.loreEntry?.title ?? null,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/rank"
          className="inline-flex items-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
        >
          返回战力榜
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          添加角色
        </h1>
        <p className="text-sm text-zinc-400">
          已登录用户都可以在这里把角色加入战力榜，管理员仍保留说明编辑和删除能力。
        </p>
      </div>

      <RankBoardManager boards={boardPayload} canModerateRank={false} />
    </div>
  );
}
