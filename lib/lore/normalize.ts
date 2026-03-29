export type RawNode = Record<string, unknown> & {
  id?: string;
  externalId?: string;
  name?: string;
  title?: string;
  summary?: string;
  content?: string;
  description?: string;
  category?: string;
  type?: string;
  children?: RawNode[];
};

const ALLOWED_CATEGORIES = new Set(["jinshi", "shentong", "fabao", "lingwu", "gongfa", "shuofa", "person", "org"]);

export function normalizeCategory(node: RawNode): string {
  const raw = String(node.category ?? node.type ?? "misc").toLowerCase();
  if (raw === "shentong") {
    return "shentong";
  }
  return ALLOWED_CATEGORIES.has(raw) ? raw : "misc";
}

export function nodeTitle(node: RawNode): string {
  return String(node.title ?? node.name ?? node.id ?? "未命名词条");
}

export function nodeContent(node: RawNode): string {
  return String(node.content ?? node.description ?? "");
}
