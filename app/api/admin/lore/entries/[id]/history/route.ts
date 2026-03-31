import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{
  id: string;
}>;

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return resolved.id;
}

export async function GET(
  _request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const entryId = await resolveId(params);

    const entry = await prisma.loreEntry.findUnique({
      where: { id: entryId },
      select: { id: true },
    });

    if (!entry) {
      return NextResponse.json(
        {
          message: "词条不存在。",
        },
        { status: 404 }
      );
    }

    const versions = await prisma.loreEntryVersion.findMany({
      where: { entryId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        note: true,
        createdAt: true,
        createdById: true,
      },
    });

    const userIds = Array.from(
      new Set(
        versions
          .map((version) => version.createdById)
          .filter((id): id is string => Boolean(id))
      )
    );

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              username: true,
              email: true,
            },
          })
        : [];

    const userMap = new Map(
      users.map((user) => [user.id, user.username || user.email || "未知用户"])
    );

    return NextResponse.json({
      versions: versions.map((version, index) => ({
        id: version.id,
        versionNumber: index + 1,
        createdAt: version.createdAt.toISOString(),
        editedBy: version.createdById
          ? userMap.get(version.createdById) ?? version.createdById
          : "未知用户",
        changeNote: version.note?.trim() || "未填写变更说明",
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message
            ? error.message
            : "版本记录加载失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
