import { z } from "zod";
import { LorePermissionScope } from "@prisma/client";

const requiredText = z
  .string()
  .trim()
  .min(1, "标题不能为空")
  .max(200, "标题不能超过 200 个字符");

const optionalText = z.string().default("");

const loreMetaInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const metasSchema = z
  .array(loreMetaInputSchema)
  .default([])
  .transform((metas) =>
    metas
      .map((meta) => ({
        key: meta.key.trim(),
        value: meta.value,
      }))
      .filter((meta) => meta.key.length > 0)
  );

export const loreEntryUpdateSchema = z.object({
  title: requiredText,
  summary: optionalText,
  content: optionalText,
  metas: metasSchema,
  changeNote: z.string().trim().max(500, "变更说明不能超过 500 个字符").default(""),
});

export type LoreEntryUpdateInput = z.infer<typeof loreEntryUpdateSchema>;

export const changeRequestSchema = z.object({
  entryId: z.string().trim().min(1, "词条 ID 不能为空"),
  patch: loreEntryUpdateSchema,
});

export const rollbackSchema = z.object({
  versionId: z.string().min(1, "版本 ID 不能为空"),
});

export const loreReviewDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const permissionSchema = z
  .object({
    userId: z.string().trim().min(1, "用户不能为空"),
    level: z.enum(["EDIT", "REVIEW", "ADMIN"]),
    scopeType: z.nativeEnum(LorePermissionScope),
    scopeValue: z.string().trim().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType !== LorePermissionScope.GLOBAL && !value.scopeValue?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "分类权限和单词条权限必须填写范围值",
        path: ["scopeValue"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    scopeValue:
      value.scopeType === LorePermissionScope.GLOBAL
        ? null
        : value.scopeValue?.trim() ?? null,
  }));
