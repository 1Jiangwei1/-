import { NextResponse } from "next/server";
import { LorePermissionScope } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  canAssignLorePermission,
  hasAnyLoreCapability,
} from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";
import { permissionSchema } from "@/lib/lore/validators";

async function canOpenPermissionPage() {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  return hasAnyLoreCapability(user.id, "ADMIN");
}

export async function GET() {
  if (!(await canOpenPermissionPage())) {
    return NextResponse.json({ error: "没有权限查看权限分配" }, { status: 403 });
  }

  const [items, users] = await Promise.all([
    prisma.loreEditorPermission.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return NextResponse.json({ items, users });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = permissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "权限参数不正确" },
      { status: 400 }
    );
  }

  const allowed = await canAssignLorePermission(
    user.id,
    parsed.data.scopeType,
    parsed.data.scopeType === LorePermissionScope.GLOBAL
      ? null
      : parsed.data.scopeValue
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "没有权限分配这个范围的权限" },
      { status: 403 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: parsed.data.userId,
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
  }

  await prisma.loreEditorPermission.deleteMany({
    where: {
      userId: parsed.data.userId,
      scopeType: parsed.data.scopeType,
      scopeValue: parsed.data.scopeValue,
    },
  });

  const item = await prisma.loreEditorPermission.create({
    data: parsed.data,
    include: {
      user: {
        select: {
          username: true,
          role: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
