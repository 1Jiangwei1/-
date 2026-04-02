import Link from "next/link";
import { UserRole } from "@prisma/client";

import RankBoardManager from "@/components/admin/rank-board-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";
import { RANK_BOARD_DEFINITIONS } from "@/lib/rank/boards";

export default async function AdminRankPage() {
  const user = await getCurrentUser();
  const canModerateRank =
    !!user && (user.role === UserRole.OWNER || user.role === UserRole.ADMIN);

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

  const boards = await Promise.all(
    RANK_BOARD_DEFINITIONS.map(async (definition) => {
      const existing = boardMap.get(definition.title);

      if (existing) {
        return existing;
      }

      return prisma.rankBoard.create({
        data: {
          title: definition.title,
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
      });
    })
  );

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
          返回战力排行
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          榜单管理
        </h1>
        <p className="text-sm text-zinc-400">
          战力榜现在只支持手动填写名称创建角色。已有旧词条绑定数据仍可继续展示。
        </p>
      </div>

      <RankBoardManager boards={boardPayload} canModerateRank={canModerateRank} />
    </div>
  );
}