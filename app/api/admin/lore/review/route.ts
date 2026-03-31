import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

function readChangeNote(patch: unknown) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return "未填写变更说明";
  }

  const record = patch as Record<string, unknown>;
  const value = record.changeNote;
  return typeof value === "string" && value.trim() ? value : "未填写变更说明";
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "请先登录后再查看审核列表。",
        },
        { status: 401 }
      );
    }

    const requests = await prisma.loreChangeRequest.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        patch: true,
        entry: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        requester: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    const visibility = await Promise.all(
      requests.map((request) =>
        canManageLore(user.id, "REVIEW", request.entry.category, request.entry.id)
      )
    );

    const items = requests
      .filter((_request, index) => visibility[index])
      .map((request) => ({
        id: request.id,
        entryId: request.entry.id,
        entryTitle: request.entry.title,
        createdAt: request.createdAt.toISOString(),
        requesterName: request.requester.username || request.requester.email,
        changeNote: readChangeNote(request.patch),
      }));

    return NextResponse.json({
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message
            ? error.message
            : "审核列表加载失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
