import { PrismaClient, LoreRelationType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";

import { getLoreCategoryLabel } from "../lib/lore/category-label";
import { normalizeCategory, nodeContent, nodeTitle, type RawNode } from "../lib/lore/normalize";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readValue(node: RawNode, key: string) {
  const value = (node as Record<string, unknown>)[key];
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function mergeNodes(current: RawNode, incoming: RawNode) {
  const merged = { ...current } as RawNode;

  for (const [key, rawValue] of Object.entries(incoming as Record<string, unknown>)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const existing = (merged as Record<string, unknown>)[key];
    const existingText = typeof existing === "string" ? existing.trim() : existing;

    if (
      existing === undefined ||
      existing === null ||
      existingText === "" ||
      (Array.isArray(existing) && existing.length === 0)
    ) {
      (merged as Record<string, unknown>)[key] = rawValue;
      continue;
    }

    if (key === "children" && Array.isArray(existing) && Array.isArray(rawValue)) {
      const childMap = new Map<string, RawNode>();
      for (const child of existing as RawNode[]) {
        childMap.set(String(child.externalId ?? child.id ?? randomUUID()), child);
      }
      for (const child of rawValue as RawNode[]) {
        childMap.set(String(child.externalId ?? child.id ?? randomUUID()), child);
      }
      (merged as Record<string, unknown>)[key] = Array.from(childMap.values());
    }
  }

  return merged;
}

function buildSummary(node: RawNode) {
  const description = readValue(node, "description");
  if (description) {
    return description;
  }

  const fallbackParts = [
    readValue(node, "texing"),
    readValue(node, "kezhi"),
    readValue(node, "runyuwei"),
  ].filter(Boolean);

  if (fallbackParts.length === 0) {
    return undefined;
  }

  return fallbackParts.join("；").slice(0, 120);
}

function buildContent(node: RawNode) {
  const sections: string[] = [];
  const title = nodeTitle(node);
  const description = readValue(node, "description");
  const shiji = readValue(node, "shiji");

  if (title) {
    sections.push(`词条：${title}`);
  }
  if (description) {
    sections.push(`概述：${description}`);
  }

  const fieldLabels: Array<[string, string]> = [
    ["daotong", "道统"],
    ["yixiang", "异象"],
    ["texing", "特性"],
    ["kezhi", "克制"],
    ["runyuwei", "润育位"],
    ["leader", "首领"],
    ["orgName", "所属势力"],
    ["xiuwei", "修为"],
    ["fabao", "法宝"],
    ["shentong", "神通"],
    ["jinshi", "金性"],
    ["region", "地域"],
    ["effect", "效果"],
    ["source", "来源"],
  ];

  for (const [key, label] of fieldLabels) {
    const value = readValue(node, key);
    if (value) {
      sections.push(`${label}：${value}`);
    }
  }

  if (shiji) {
    sections.push(`事迹：${shiji}`);
  }

  const normalized = nodeContent(node)?.trim();
  if (normalized && !sections.some((item) => item.includes(normalized))) {
    sections.push(normalized);
  }

  return sections.filter(Boolean).join("\n\n");
}

function buildMetas(node: RawNode, normalizedCategory: string) {
  const metas: Array<{ key: string; value: string }> = [];
  const metaFields: Array<[string, string]> = [
    ["daotong", "道统"],
    ["yixiang", "异象"],
    ["texing", "特性"],
    ["kezhi", "克制"],
    ["runyuwei", "润育位"],
    ["parentName", "上级词条"],
    ["orgName", "所属势力"],
    ["leader", "首领"],
    ["xiuwei", "修为"],
    ["fabao", "法宝"],
    ["shentong", "神通"],
    ["jinshi", "金性"],
    ["region", "地域"],
    ["effect", "效果"],
    ["source", "来源"],
  ];

  for (const [field, label] of metaFields) {
    const value = readValue(node, field);
    if (value) {
      metas.push({ key: label, value });
    }
  }

  metas.push({ key: "分类", value: getLoreCategoryLabel(normalizedCategory) });

  const unique = new Map<string, string>();
  for (const meta of metas) {
    if (!unique.has(meta.key)) {
      unique.set(meta.key, meta.value);
    }
  }

  return Array.from(unique.entries()).map(([key, value]) => ({ key, value }));
}

function toInputJson(value: RawNode): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  const rawText = await fs.readFile(path.resolve(__dirname, "builtinData.json"), "utf-8");
  const arr = JSON.parse(rawText) as RawNode[];

  await prisma.rawLoreRecord.createMany({
    data: arr.map((item) => ({
      externalId: item.externalId?.toString() ?? item.id?.toString(),
      payload: toInputJson(item),
    })),
  });

  const dedup = new Map<string, RawNode>();
  const edges: Array<{ from: string; to: string }> = [];

  function walk(node: RawNode, parent?: string) {
    const key = String(node.externalId ?? node.id ?? randomUUID());
    if (!dedup.has(key)) {
      dedup.set(key, node);
    } else {
      dedup.set(key, mergeNodes(dedup.get(key)!, node));
    }

    if (parent) {
      edges.push({ from: parent, to: key });
    }

    for (const child of node.children ?? []) {
      walk(child, key);
    }
  }

  for (const item of arr) {
    walk(item);
  }

  for (const [key, node] of dedup.entries()) {
    const category = normalizeCategory(node);
    const entry = await prisma.loreEntry.upsert({
      where: { slug: key },
      create: {
        slug: key,
        title: nodeTitle(node),
        summary: buildSummary(node),
        content: buildContent(node),
        category,
        externalId: key,
        rawJson: toInputJson(node),
      },
      update: {
        title: nodeTitle(node),
        summary: buildSummary(node),
        content: buildContent(node),
        category,
        rawJson: toInputJson(node),
      },
    });

    const metas = buildMetas(node, category);
    await prisma.loreMeta.deleteMany({
      where: {
        entryId: entry.id,
      },
    });

    if (metas.length > 0) {
      await prisma.loreMeta.createMany({
        data: metas.map((meta) => ({
          entryId: entry.id,
          key: meta.key,
          value: meta.value,
        })),
      });
    }
  }

  for (const edge of edges) {
    const from = await prisma.loreEntry.findUnique({ where: { slug: edge.from } });
    const to = await prisma.loreEntry.findUnique({ where: { slug: edge.to } });
    if (!from || !to) {
      continue;
    }

    await prisma.loreRelation.upsert({
      where: {
        fromEntryId_toEntryId_type: {
          fromEntryId: from.id,
          toEntryId: to.id,
          type: LoreRelationType.CHILD,
        },
      },
      create: { fromEntryId: from.id, toEntryId: to.id, type: LoreRelationType.CHILD },
      update: {},
    });
  }

  console.log(`Imported raw=${arr.length}, normalized=${dedup.size}, relations=${edges.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
