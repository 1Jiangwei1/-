import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{
  id: string;
}>;

const VOTE_VALUE_MAP = {
  support: 1,
  oppose: -1,
} as const;

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return resolved.id;
}

function summarizeVotes(votes: Array<{ value: number }>) {
  return {
    supportCount: votes.filter((vote) => vote.value === 1).length,
    opposeCount: votes.filter((vote) => vote.value === -1).length,
    score: votes.reduce((total, vote) => total + vote.value, 0),
  };
}

export async function POST(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再投票。",
        },
        { status: 401 }
      );
    }

    const rankItemId = await resolveId(params);
    const body = (await request.json()) as {
      action?: keyof typeof VOTE_VALUE_MAP;
    };

    const action = body.action;

    if (!action || !(action in VOTE_VALUE_MAP)) {
      return NextResponse.json(
        {
          success: false,
          message: "投票类型不正确。",
        },
        { status: 400 }
      );
    }

    const item = await prisma.rankItem.findUnique({
      where: { id: rankItemId },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "排行对象不存在。",
        },
        { status: 404 }
      );
    }

    const voteValue = VOTE_VALUE_MAP[action];

    const summary = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.rankVote.findFirst({
        where: {
          rankItemId,
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (existingVote) {
        await tx.rankVote.update({
          where: {
            id: existingVote.id,
          },
          data: {
            value: voteValue,
          },
        });
      } else {
        await tx.rankVote.create({
          data: {
            rankItemId,
            userId: user.id,
            value: voteValue,
          },
        });
      }

      const votes = await tx.rankVote.findMany({
        where: {
          rankItemId,
        },
        select: {
          value: true,
        },
      });

      const result = summarizeVotes(votes);

      await tx.rankItem.update({
        where: {
          id: rankItemId,
        },
        data: {
          score: result.score,
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: "投票成功",
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "投票失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
