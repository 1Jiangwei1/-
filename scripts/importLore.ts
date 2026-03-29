import { PrismaClient, LoreRelationType } from "@prisma/client";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCategory, nodeContent, nodeTitle, type RawNode } from "../lib/lore/normalize";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rawText = await fs.readFile(path.resolve(__dirname, "builtinData.json"), "utf-8");
  const arr = JSON.parse(rawText) as RawNode[];

  await prisma.rawLoreRecord.createMany({
    data: arr.map((item) => ({ externalId: item.externalId?.toString() ?? item.id?.toString(), payload: item })),
  });

  const dedup = new Map<string, RawNode>();
  const edges: Array<{ from: string; to: string }> = [];

  function walk(node: RawNode, parent?: string) {
    const key = String(node.externalId ?? node.id ?? randomUUID());
    if (!dedup.has(key)) dedup.set(key, node);
    if (parent) edges.push({ from: parent, to: key });
    for (const child of node.children ?? []) {
      walk(child, key);
    }
  }

  for (const item of arr) walk(item);

  for (const [key, node] of dedup.entries()) {
    await prisma.loreEntry.upsert({
      where: { slug: key },
      create: {
        slug: key,
        title: nodeTitle(node),
        summary: node.summary?.toString(),
        content: nodeContent(node),
        category: normalizeCategory(node),
        externalId: key,
        rawJson: node,
      },
      update: {
        title: nodeTitle(node),
        summary: node.summary?.toString(),
        content: nodeContent(node),
        category: normalizeCategory(node),
        rawJson: node,
      },
    });
  }

  for (const e of edges) {
    const from = await prisma.loreEntry.findUnique({ where: { slug: e.from } });
    const to = await prisma.loreEntry.findUnique({ where: { slug: e.to } });
    if (!from || !to) continue;
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
