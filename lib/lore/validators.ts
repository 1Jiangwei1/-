import { LorePermissionLevel, LorePermissionScope } from "@prisma/client";
import { z } from "zod";

export const changeRequestSchema = z.object({
  entryId: z.string(),
  patch: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const permissionSchema = z.object({
  userId: z.string(),
  scopeType: z.nativeEnum(LorePermissionScope),
  scopeValue: z.string().optional(),
  level: z.nativeEnum(LorePermissionLevel),
});

export const entryPatchSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  meta: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  note: z.string().optional(),
});

export const rollbackSchema = z.object({ versionId: z.string() });
