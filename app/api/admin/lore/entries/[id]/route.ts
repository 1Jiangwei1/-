import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreAccess } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";
import { loreEntryUpdateSchema } from "@/lib/lore/validators";

type RouteParams = Promise<{
  id: string;
}>;

function normalizeId(rawId: string) {
  return /^\d+$/.test(rawId) ? Number(rawId) : rawId;
}

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return normalizeId(resolved.id);
}

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();
    const id = await resolveId(params);
    const json = await request.json();
    const parsed = loreEntryUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "提交数据格式不正确。",
        },
        { status: 400 }
      );
    }

    const existingEntry = await prisma.loreEntry.findUnique({
      where: { id } as never,
      select: {
        id: true,
        category: true,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "词条不存在。",
        },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再提交修改。",
        },
        { status: 401 }
      );
    }

    const access = await getLoreAccess(user.id, existingEntry.category, existingEntry.id);

    if (!access.canEdit && !access.canSuggest) {
      return NextResponse.json(
        {
          success: false,
          message: "你没有编辑或提交修改建议的权限。",
        },
        { status: 403 }
      );
    }

    if (!access.canEdit) {
      const changeRequest = await prisma.loreChangeRequest.create({
        data: {
          entryId: existingEntry.id,
          requesterId: user.id,
          patch: {
            title: parsed.data.title,
            summary: parsed.data.summary,
            content: parsed.data.content,
            metas: parsed.data.metas,
            changeNote: parsed.data.changeNote,
          },
          status: "PENDING",
        } as never,
        select: {
          id: true,
        },
      });

      return NextResponse.json({
        success: true,
        mode: "request",
        message: "修改建议已提交，等待审核。",
        requestId: changeRequest.id,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedEntry = await tx.loreEntry.update({
        where: { id } as never,
        data: {
          title: parsed.data.title,
          summary: parsed.data.summary,
          content: parsed.data.content,
        } as never,
        select: {
          id: true,
          title: true,
          summary: true,
          content: true,
          updatedAt: true,
        },
      });

      await tx.loreMeta.deleteMany({
        where: {
          entryId: updatedEntry.id,
        } as never,
      });

      if (parsed.data.metas.length > 0) {
        await tx.loreMeta.createMany({
          data: parsed.data.metas.map((meta) => ({
            entryId: updatedEntry.id,
            key: meta.key,
            value: meta.value,
          })) as never,
        });
      }

      const savedMetas = await tx.loreMeta.findMany({
        where: {
          entryId: updatedEntry.id,
        } as never,
        select: {
          id: true,
          key: true,
          value: true,
        },
      });

      await tx.loreEntryVersion.create({
        data: {
          entryId: updatedEntry.id,
          note: parsed.data.changeNote || "编辑词条",
          createdById: user.id,
          snapshot: {
            title: updatedEntry.title,
            summary: updatedEntry.summary,
            content: updatedEntry.content,
            category: existingEntry.category,
            metas: savedMetas.map((meta) => ({
              key: meta.key,
              value: meta.value,
            })),
          },
        } as never,
      });

      return {
        entry: updatedEntry,
        metas: savedMetas,
      };
    });

    return NextResponse.json({
      success: true,
      mode: "edit",
      message: "保存成功",
      entry: {
        ...result.entry,
        updatedAt: result.entry.updatedAt.toISOString(),
      },
      metas: result.metas,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "保存失败，服务器暂时无法处理该请求。",
      },
      { status: 500 }
    );
  }
}
