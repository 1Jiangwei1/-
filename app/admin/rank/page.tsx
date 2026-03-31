import Link from "next/link";
import { UserRole } from "@prisma/client";

import RankBoardManager from "@/components/admin/rank-board-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { matchesRankBoardCategory, RANK_BOARD_DEFINITIONS } from "@/lib/rank/boards";

export default async function AdminRankPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">没有权限进入榜单管理</h1>
        <p className="text-sm text-zinc-400">
          只有站点 OWNER 或 ADMIN 才能进入榜单管理页面。
        </p>
      </div>
    );
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

  const loreEntries = await prisma.loreEntry.findMany({
    select: {
      id: true,
      title: true,
      category: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const boardPayload = boards.map((board) => ({
    id: board.id,
    title: board.title,
    items: board.items.map((item) => ({
      id: item.id,
      score: item.score,
      loreEntryId: item.loreEntryId,
      title: item.loreEntry.title,
      category: item.loreEntry.category,
    })),
    candidates: loreEntries
      .filter((entry) => matchesRankBoardCategory(board.title, entry.category))
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
      })),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/rank" className="inline-flex items-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100">
          返回战力排行
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">榜单管理</h1>
        <p className="text-sm text-zinc-400">目前只保留人物榜，并且只允许从人物词条中选择上榜对象。</p>
      </div>

      <RankBoardManager boards={boardPayload} />
    </div>
  );
}
