import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { loreEntryUpdateSchema, loreReviewDecisionSchema } from "@/lib/lore/validators";
import { canManageLore } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{
  id: string;
}>;

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return resolved.id;
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
          message: "请先登录后再执行审核。",
        },
        { status: 401 }
      );
    }

    const id = await resolveId(params);
    const body = await request.json();
    const actionResult = loreReviewDecisionSchema.safeParse(body);

    if (!actionResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "审核动作不正确。",
        },
        { status: 400 }
      );
    }

    const changeRequest = await prisma.loreChangeRequest.findUnique({
      where: { id },
      select: {
        id: true,
        entryId: true,
        patch: true,
        status: true,
        entry: {
          select: {
            id: true,
            category: true,
          },
        },
      },
    });

    if (!changeRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "修改申请不存在。",
        },
        { status: 404 }
      );
    }

    const canReview = await canManageLore(
      user.id,
      "REVIEW",
      changeRequest.entry.category,
      changeRequest.entry.id
    );

    if (!canReview) {
      return NextResponse.json(
        {
          success: false,
          message: "没有权限审核该申请。",
        },
        { status: 403 }
      );
    }

    if (changeRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "该申请已经处理过了。",
        },
        { status: 400 }
      );
    }

    if (actionResult.data.action === "reject") {
      await prisma.loreChangeRequest.update({
        where: { id: changeRequest.id },
        data: {
          status: "REJECTED",
          reviewerId: user.id,
          reviewedAt: new Date(),
          reviewNote: "已驳回",
        },
      });

      return NextResponse.json({
        success: true,
        message: "已驳回申请",
      });
    }

    const patchResult = loreEntryUpdateSchema.safeParse(changeRequest.patch);

    if (!patchResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "申请内容格式不正确，无法通过审核。",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const updatedEntry = await tx.loreEntry.update({
        where: {
          id: changeRequest.entryId,
        },
        data: {
          title: patchResult.data.title,
          summary: patchResult.data.summary,
          content: patchResult.data.content,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          content: true,
          category: true,
        },
      });

      await tx.loreMeta.deleteMany({
        where: {
          entryId: updatedEntry.id,
        },
      });

      if (patchResult.data.metas.length > 0) {
        await tx.loreMeta.createMany({
          data: patchResult.data.metas.map((meta) => ({
            entryId: updatedEntry.id,
            key: meta.key,
            value: meta.value,
          })),
        });
      }

      await tx.loreEntryVersion.create({
        data: {
          entryId: updatedEntry.id,
          note: patchResult.data.changeNote || "通过修改申请",
          createdById: user.id,
          snapshot: {
            title: updatedEntry.title,
            summary: updatedEntry.summary,
            content: updatedEntry.content,
            category: updatedEntry.category,
            metas: patchResult.data.metas,
          },
        },
      });

      await tx.loreChangeRequest.update({
        where: {
          id: changeRequest.id,
        },
        data: {
          status: "APPROVED",
          reviewerId: user.id,
          reviewedAt: new Date(),
          reviewNote: "已通过",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "已通过申请",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "审核操作失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
