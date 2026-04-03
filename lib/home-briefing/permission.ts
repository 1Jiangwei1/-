import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function canEditHomeBriefing(userId: string | null) {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      briefingEditorPerms: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return false;
  }

  if (user.role === UserRole.OWNER) {
    return true;
  }

  return user.briefingEditorPerms.length > 0;
}
