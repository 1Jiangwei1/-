import { LorePermissionLevel, LorePermissionScope, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const rank: Record<LorePermissionLevel, number> = {
  VIEW: 0,
  SUGGEST: 1,
  EDIT: 2,
  REVIEW: 3,
  ADMIN: 4,
};

export async function canManageLore(userId: string | null, required: LorePermissionLevel, category?: string, entryId?: string) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) return true;

  const perms = await prisma.loreEditorPermission.findMany({ where: { userId } });
  const best = perms.reduce((max, p) => {
    const matchGlobal = p.scopeType === LorePermissionScope.GLOBAL;
    const matchCategory = p.scopeType === LorePermissionScope.CATEGORY && p.scopeValue === category;
    const matchEntry = p.scopeType === LorePermissionScope.ENTRY && p.scopeValue === entryId;
    if (!matchGlobal && !matchCategory && !matchEntry) return max;
    return Math.max(max, rank[p.level]);
  }, -1);
  return best >= rank[required];
}
