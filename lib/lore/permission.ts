import {
  LorePermissionLevel,
  LorePermissionScope,
  UserRole,
  type LoreEditorPermission,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const permissionCapabilities: Record<
  LorePermissionLevel,
  Set<LorePermissionLevel>
> = {
  VIEW: new Set(["VIEW"]),
  SUGGEST: new Set(["VIEW", "SUGGEST"]),
  EDIT: new Set(["VIEW", "SUGGEST", "EDIT", "REVIEW"]),
  REVIEW: new Set(["VIEW", "SUGGEST", "EDIT", "REVIEW"]),
  ADMIN: new Set(["VIEW", "SUGGEST", "EDIT", "REVIEW", "ADMIN"]),
};

function matchesScope(
  permission: LoreEditorPermission,
  category?: string | null,
  entryId?: string | null
) {
  if (permission.scopeType === LorePermissionScope.GLOBAL) {
    return true;
  }

  if (
    permission.scopeType === LorePermissionScope.CATEGORY &&
    category &&
    permission.scopeValue === category
  ) {
    return true;
  }

  if (
    permission.scopeType === LorePermissionScope.ENTRY &&
    entryId &&
    permission.scopeValue === entryId
  ) {
    return true;
  }

  return false;
}

async function getUserAndPermissions(userId: string | null) {
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      editorPerms: true,
    },
  });
}

export async function canManageLore(
  userId: string | null,
  required: LorePermissionLevel,
  category?: string | null,
  entryId?: string | null
) {
  const user = await getUserAndPermissions(userId);

  if (!user) {
    return false;
  }

  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return true;
  }

  if (required === LorePermissionLevel.VIEW || required === LorePermissionLevel.SUGGEST) {
    return true;
  }

  return user.editorPerms.some(
    (permission) =>
      matchesScope(permission, category, entryId) &&
      permissionCapabilities[permission.level].has(required)
  );
}

export async function getLoreAccess(
  userId: string | null,
  category?: string | null,
  entryId?: string | null
) {
  const user = await getUserAndPermissions(userId);

  const base = {
    canView: false,
    canSuggest: false,
    canEdit: false,
    canReview: false,
    canAdmin: false,
    isOwner: false,
    isSiteAdmin: false,
  };

  if (!user) {
    return base;
  }

  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return {
      canView: true,
      canSuggest: true,
      canEdit: true,
      canReview: true,
      canAdmin: true,
      isOwner: user.role === UserRole.OWNER,
      isSiteAdmin: user.role === UserRole.ADMIN,
    };
  }

  const matchingPermissions = user.editorPerms.filter((permission) =>
    matchesScope(permission, category, entryId)
  );

  return {
    canView: true,
    canSuggest: true,
    canEdit: matchingPermissions.some((permission) =>
      permissionCapabilities[permission.level].has("EDIT")
    ),
    canReview: matchingPermissions.some((permission) =>
      permissionCapabilities[permission.level].has("REVIEW")
    ),
    canAdmin: matchingPermissions.some((permission) =>
      permissionCapabilities[permission.level].has("ADMIN")
    ),
    isOwner: false,
    isSiteAdmin: false,
  };
}

export async function hasAnyLoreCapability(
  userId: string | null,
  required: LorePermissionLevel
) {
  const user = await getUserAndPermissions(userId);

  if (!user) {
    return false;
  }

  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return true;
  }

  if (required === LorePermissionLevel.VIEW || required === LorePermissionLevel.SUGGEST) {
    return true;
  }

  return user.editorPerms.some((permission) =>
    permissionCapabilities[permission.level].has(required)
  );
}

export async function canAssignLorePermission(
  userId: string | null,
  scopeType: LorePermissionScope,
  scopeValue?: string | null
) {
  const user = await getUserAndPermissions(userId);

  if (!user) {
    return false;
  }

  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return true;
  }

  if (scopeType === LorePermissionScope.GLOBAL) {
    return user.editorPerms.some(
      (permission) =>
        permission.scopeType === LorePermissionScope.GLOBAL &&
        permission.level === LorePermissionLevel.ADMIN
    );
  }

  if (scopeType === LorePermissionScope.CATEGORY) {
    return user.editorPerms.some(
      (permission) =>
        permission.level === LorePermissionLevel.ADMIN &&
        (permission.scopeType === LorePermissionScope.GLOBAL ||
          (permission.scopeType === LorePermissionScope.CATEGORY &&
            permission.scopeValue === scopeValue))
    );
  }

  if (!scopeValue) {
    return false;
  }

  const entry = await prisma.loreEntry.findUnique({
    where: { id: scopeValue },
    select: {
      id: true,
      category: true,
    },
  });

  if (!entry) {
    return false;
  }

  return user.editorPerms.some(
    (permission) =>
      permission.level === LorePermissionLevel.ADMIN &&
      (permission.scopeType === LorePermissionScope.GLOBAL ||
        (permission.scopeType === LorePermissionScope.CATEGORY &&
          permission.scopeValue === entry.category) ||
        (permission.scopeType === LorePermissionScope.ENTRY &&
          permission.scopeValue === entry.id))
  );
}
